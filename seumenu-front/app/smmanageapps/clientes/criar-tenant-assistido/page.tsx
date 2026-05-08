"use client";

import { useEffect, useMemo, useState } from "react";
import { PageShell } from "../../../components/dashboard/PageShell";
import { HelpLabel } from "../components/HelpLabel";
import { apiRequest } from "../../../lib/api";
import {
  LicensePlanOption,
  checkTenantSlugAvailability,
  fetchActiveLicensePlans,
  provisionTenantAssisted,
} from "../clientes-api";

type WizardForm = {
  tenantName: string;
  tenantSlug: string;
  tenantActive: boolean;
  domain: string;
  subdomain: string;
  externalRef: string;
  planCode: string;
  licenseStatus: "active" | "trial" | "suspended" | "expired";
  storeNome: string;
  storeCnpj: string;
  storeResumo: string;
  storeBannerUrl: string;
  storeLogoUrl: string;
  storeHorarioFuncionamento: string;
  storeLocalizacao: string;
  storeCorFundo: string;
  storeHabilitaVerificacaoMesa: boolean;
  initialUsers: Array<{
    nome: string;
    email: string;
    roleKey: "admin" | "cozinha" | "atendimento";
    permissions: string[];
  }>;
};

type FieldErrors = Partial<Record<keyof WizardForm, string>>;

const steps = [
  "Identificacao do Tenant",
  "Plano/Licenca",
  "Dados da Loja",
  "Usuarios Iniciais",
  "Revisao",
  "Finalizacao",
];

const fallbackPlans: LicensePlanOption[] = [
  { id: 1, code: "mensal", nome: "Mensal", defaultDurationDays: 30, ativo: true },
  { id: 2, code: "trimestral", nome: "Trimestral", defaultDurationDays: 90, ativo: true },
  { id: 3, code: "semestral", nome: "Semestral", defaultDurationDays: 180, ativo: true },
  { id: 4, code: "anual", nome: "Anual", defaultDurationDays: 365, ativo: true },
];

const initialForm: WizardForm = {
  tenantName: "",
  tenantSlug: "",
  tenantActive: true,
  domain: "",
  subdomain: "",
  externalRef: "",
  planCode: "mensal",
  licenseStatus: "active",
  storeNome: "",
  storeCnpj: "",
  storeResumo: "",
  storeBannerUrl: "",
  storeLogoUrl: "",
  storeHorarioFuncionamento: "",
  storeLocalizacao: "",
  storeCorFundo: "#ffffff",
  storeHabilitaVerificacaoMesa: false,
  initialUsers: [
    {
      nome: "Admin",
      email: "",
      roleKey: "admin",
      permissions: ["all"],
    },
    {
      nome: "Cozinha",
      email: "",
      roleKey: "cozinha",
      permissions: ["pedido.read", "pedido.update", "pedido-item.read", "pedido-status.read", "pedido-status.update"],
    },
    {
      nome: "Atendimento",
      email: "",
      roleKey: "atendimento",
      permissions: ["mesa.read", "mesa.update", "pedido.read", "pedido.create", "pedido.update", "pedido-item.read"],
    },
  ],
};

const permissionOptions = [
  "all",
  "mesa.read",
  "mesa.update",
  "pedido.read",
  "pedido.create",
  "pedido.update",
  "pedido-item.read",
  "pedido-status.read",
  "pedido-status.update",
];

function hasStoreData(form: WizardForm) {
  const values = [
    form.storeNome,
    form.storeCnpj,
    form.storeResumo,
    form.storeBannerUrl,
    form.storeLogoUrl,
    form.storeHorarioFuncionamento,
    form.storeLocalizacao,
  ];
  return values.some((value) => value.trim().length > 0) || form.storeHabilitaVerificacaoMesa;
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-/, "")
    .slice(0, 120);
}

function validateStepOne(form: WizardForm) {
  const errors: FieldErrors = {};
  if (!form.tenantName.trim()) {
    errors.tenantName = "Informe o nome do tenant.";
  }
  if (!form.tenantSlug.trim()) {
    errors.tenantSlug = "Informe o identificador (slug).";
  } else if (!/^[a-z0-9-]+$/.test(form.tenantSlug)) {
    errors.tenantSlug = "Use apenas letras minusculas, numeros e hifen.";
  }
  return errors;
}

export default function CriacaoTenantAssistidaPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardForm>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [plans, setPlans] = useState<LicensePlanOption[]>(fallbackPlans);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugChecked, setSlugChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [createdUsers, setCreatedUsers] = useState<
    Array<{ nome: string; email: string; role: string; tempPassword: string; forcePasswordChange: boolean }>
  >([]);
  const [storeBannerFile, setStoreBannerFile] = useState<File | null>(null);
  const [storeLogoFile, setStoreLogoFile] = useState<File | null>(null);

  useEffect(() => {
    fetchActiveLicensePlans()
      .then((response) => {
        if (response.length > 0) {
          setPlans(response);
          setForm((prev) => ({
            ...prev,
            planCode: response.some((plan) => plan.code === prev.planCode) ? prev.planCode : response[0].code,
          }));
        }
      })
      .catch(() => {
        setPlans(fallbackPlans);
      });
  }, []);

  const adminEmail = useMemo(() => (form.tenantSlug ? `admin@${form.tenantSlug}.seumenu` : "-"), [form.tenantSlug]);
  const cozinhaEmail = useMemo(() => (form.tenantSlug ? `cozinha@${form.tenantSlug}.seumenu` : "-"), [form.tenantSlug]);
  const atendimentoEmail = useMemo(() => (form.tenantSlug ? `atendimento@${form.tenantSlug}.seumenu` : "-"), [form.tenantSlug]);

  useEffect(() => {
    setForm((prev) => {
      const users = [...prev.initialUsers];
      if (users[0]) users[0] = { ...users[0], email: form.tenantSlug ? `admin@${form.tenantSlug}.seumenu` : "" };
      if (users[1]) users[1] = { ...users[1], email: form.tenantSlug ? `cozinha@${form.tenantSlug}.seumenu` : "" };
      if (users[2]) users[2] = { ...users[2], email: form.tenantSlug ? `atendimento@${form.tenantSlug}.seumenu` : "" };
      return { ...prev, initialUsers: users };
    });
  }, [form.tenantSlug]);

  const canGoNext = useMemo(() => {
    if (step === 0) {
      return Object.keys(validateStepOne(form)).length === 0 && !checkingSlug;
    }
    if (step === 1) {
      return Boolean(form.planCode);
    }
    if (step === 2) {
      return true;
    }
    if (step === 3) {
      return true;
    }
    return false;
  }, [checkingSlug, form, step]);

  async function handleNext() {
    setGlobalError(null);
    if (step === 0) {
      const validation = validateStepOne(form);
      setErrors(validation);
      if (Object.keys(validation).length > 0) return;

      try {
        setCheckingSlug(true);
        const response = await checkTenantSlugAvailability(form.tenantSlug);
        setSlugChecked(true);
        if (!response.available) {
          setErrors((prev) => ({ ...prev, tenantSlug: "Este slug ja esta em uso." }));
          return;
        }
      } catch (error) {
        setGlobalError(error instanceof Error ? error.message : "Nao foi possivel validar o slug.");
        return;
      } finally {
        setCheckingSlug(false);
      }
    }

    if (step === 1 && !form.planCode) {
      setErrors((prev) => ({ ...prev, planCode: "Selecione um plano." }));
      return;
    }

    setErrors({});
    setStep((current) => Math.min(current + 1, 5));
  }

  function handleBack() {
    setGlobalError(null);
    setStep((current) => Math.max(current - 1, 0));
  }

  async function handleFinish() {
    setGlobalError(null);
    setResultMessage(null);
    setIsSubmitting(true);
    try {
      const uploadedBannerUrl = storeBannerFile
        ? await uploadStoreAsset(storeBannerFile)
        : undefined;
      const uploadedLogoUrl = storeLogoFile
        ? await uploadStoreAsset(storeLogoFile)
        : undefined;
      const bannerUrlValue = (uploadedBannerUrl ?? form.storeBannerUrl.trim()) || undefined;
      const logoUrlValue = (uploadedLogoUrl ?? form.storeLogoUrl.trim()) || undefined;

      const store = hasStoreData(form)
        ? {
            nome: form.storeNome.trim() || undefined,
            cnpj: form.storeCnpj.trim() || undefined,
            resumo: form.storeResumo.trim() || undefined,
            bannerUrl: bannerUrlValue,
            logoUrl: logoUrlValue,
            horarioFuncionamento: form.storeHorarioFuncionamento.trim() || undefined,
            localizacao: form.storeLocalizacao.trim() || undefined,
            corFundo: form.storeCorFundo.trim() || undefined,
            habilitaVerificacaoMesa: form.storeHabilitaVerificacaoMesa,
          }
        : undefined;

      const result = await provisionTenantAssisted({
        tenantName: form.tenantName.trim(),
        tenantSlug: form.tenantSlug.trim().toLowerCase(),
        tenantActive: form.tenantActive,
        domain: form.domain.trim() || undefined,
        subdomain: form.subdomain.trim() || undefined,
        planCode: form.planCode,
        licenseStatus: form.licenseStatus,
        externalRef: form.externalRef.trim() || undefined,
        store,
        initialUsers: form.initialUsers.map((user) => ({
          nome: user.nome.trim(),
          email: user.email.trim().toLowerCase(),
          roleKey: user.roleKey,
          permissions: user.permissions,
        })),
      });
      const message = (result as { message?: string }).message ?? "Tenant criado com sucesso.";
      const users = (result as { defaultUsers?: Array<{ nome: string; email: string; role: string; tempPassword: string; forcePasswordChange: boolean }> }).defaultUsers ?? [];
      setCreatedUsers(users);
      setResultMessage(message);
      setStep(5);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "Falha ao criar tenant.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function restartWizard() {
    setForm(initialForm);
    setStoreBannerFile(null);
    setStoreLogoFile(null);
    setErrors({});
    setGlobalError(null);
    setResultMessage(null);
    setCreatedUsers([]);
    setSlugChecked(false);
    setStep(0);
  }

  async function uploadStoreAsset(file: File) {
    const payload = new FormData();
    payload.append("file", file);
    const response = await apiRequest<{ url: string }>("/files", {
      method: "POST",
      authScope: "saas",
      body: payload,
    });
    return response.url;
  }

  return (
    <PageShell title="Criar Tenant (Assistido)" scope="saas">
      <section className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
        <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--brand-navy)]/60">Wizard</p>
        <h2 className="mt-2 text-2xl font-semibold text-[color:var(--brand-ink)]">Criar Tenant (Assistido)</h2>
        <p className="mt-2 text-sm text-[color:var(--brand-navy)]/70">
          Fluxo unificado para provisionar tenant, licenca padrao e usuarios iniciais em uma unica jornada.
        </p>
      </section>

      <section className="rounded-[var(--radius-md)] bg-[color:var(--color-white)] p-6 shadow-[var(--shadow-soft)]">
        <div className="mb-6 grid gap-2 md:grid-cols-6">
          {steps.map((stepLabel, index) => {
            const active = index === step;
            const completed = index < step;
            return (
              <div
                key={stepLabel}
                className={`rounded-xl border px-3 py-2 text-xs ${
                  active
                    ? "border-[color:var(--brand-navy)] bg-[color:var(--brand-navy)]/10 text-[color:var(--brand-navy)]"
                    : completed
                      ? "border-[color:var(--brand-green)]/40 bg-[color:var(--brand-green)]/10 text-[color:var(--brand-ink)]"
                      : "border-[color:var(--brand-navy)]/10 text-[color:var(--brand-navy)]/60"
                }`}
              >
                <strong className="block">Etapa {index + 1}</strong>
                <span>{stepLabel}</span>
              </div>
            );
          })}
        </div>

        {step === 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            <HelpLabel label="Nome do tenant" help="Nome comercial do cliente.">
              <input
                className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                value={form.tenantName}
                onChange={(event) => setForm((prev) => ({ ...prev, tenantName: event.target.value }))}
                required
              />
              {errors.tenantName ? <p className="mt-1 text-xs text-red-600">{errors.tenantName}</p> : null}
            </HelpLabel>

            <HelpLabel label="Identificador (slug/tenantId)" help="Deve ser unico. Use apenas letras minusculas, numeros e hifen.">
              <input
                className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                value={form.tenantSlug}
                onChange={(event) => {
                  const slug = normalizeSlug(event.target.value);
                  setForm((prev) => ({ ...prev, tenantSlug: slug }));
                  setSlugChecked(false);
                }}
                required
              />
              {errors.tenantSlug ? <p className="mt-1 text-xs text-red-600">{errors.tenantSlug}</p> : null}
              {!errors.tenantSlug && slugChecked ? <p className="mt-1 text-xs text-green-700">Slug validado e disponivel.</p> : null}
            </HelpLabel>

            <HelpLabel label="Status inicial do tenant" help="Define se o tenant ja nasce ativo no onboarding.">
              <select
                className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                value={form.tenantActive ? "active" : "inactive"}
                onChange={(event) => setForm((prev) => ({ ...prev, tenantActive: event.target.value === "active" }))}
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </HelpLabel>

            <HelpLabel label="Referencia externa" help="Campo opcional para rastrear onboarding em sistemas externos.">
              <input
                className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                value={form.externalRef}
                onChange={(event) => setForm((prev) => ({ ...prev, externalRef: event.target.value }))}
              />
            </HelpLabel>

            <HelpLabel label="Dominio" help="Opcional. Usado para resolver tenant por host.">
              <input
                className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                value={form.domain}
                onChange={(event) => setForm((prev) => ({ ...prev, domain: event.target.value }))}
              />
            </HelpLabel>

            <HelpLabel label="Subdominio" help="Opcional. Tambem pode ser usado para roteamento multi-tenant.">
              <input
                className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                value={form.subdomain}
                onChange={(event) => setForm((prev) => ({ ...prev, subdomain: event.target.value }))}
              />
            </HelpLabel>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-3 md:grid-cols-2">
            <HelpLabel label="Plano padrao de licenca" help="Planos seeded no catalogo global.">
              <select
                className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                value={form.planCode}
                onChange={(event) => setForm((prev) => ({ ...prev, planCode: event.target.value }))}
                required
              >
                {plans.map((plan) => (
                  <option key={plan.code} value={plan.code}>
                    {plan.nome} ({plan.defaultDurationDays} dias)
                  </option>
                ))}
              </select>
            </HelpLabel>
            <HelpLabel label="Status da licenca inicial" help="Status inicial aplicado na licenca provisionada.">
              <select
                className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                value={form.licenseStatus}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    licenseStatus: event.target.value as WizardForm["licenseStatus"],
                  }))
                }
              >
                <option value="active">Ativa</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspensa</option>
                <option value="expired">Expirada</option>
              </select>
            </HelpLabel>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-3 md:grid-cols-2">
            <HelpLabel label="Nome da loja" help="Opcional no onboarding. Se vazio, pode cadastrar depois no painel.">
              <input
                className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                value={form.storeNome}
                onChange={(event) => setForm((prev) => ({ ...prev, storeNome: event.target.value }))}
              />
            </HelpLabel>
            <HelpLabel label="CNPJ da loja" help="Opcional.">
              <input
                className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                value={form.storeCnpj}
                onChange={(event) => setForm((prev) => ({ ...prev, storeCnpj: event.target.value }))}
              />
            </HelpLabel>
            <HelpLabel label="Resumo da loja" help="Descricao curta para apresentacao.">
              <textarea
                className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                value={form.storeResumo}
                onChange={(event) => setForm((prev) => ({ ...prev, storeResumo: event.target.value }))}
              />
            </HelpLabel>
            <HelpLabel label="Horario funcionamento" help="Opcional no wizard; pode editar depois.">
              <input
                className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                value={form.storeHorarioFuncionamento}
                onChange={(event) => setForm((prev) => ({ ...prev, storeHorarioFuncionamento: event.target.value }))}
              />
            </HelpLabel>
            <HelpLabel label="Localizacao" help="Endereco ou referencia da loja.">
              <input
                className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                value={form.storeLocalizacao}
                onChange={(event) => setForm((prev) => ({ ...prev, storeLocalizacao: event.target.value }))}
              />
            </HelpLabel>
            <HelpLabel label="Cor de fundo" help="Cor de identidade visual.">
              <input
                type="color"
                className="h-10 w-full rounded-xl border border-[color:var(--brand-navy)]/15 px-1 py-1"
                value={form.storeCorFundo}
                onChange={(event) => setForm((prev) => ({ ...prev, storeCorFundo: event.target.value }))}
              />
            </HelpLabel>
            <HelpLabel label="Banner URL" help="Opcional. Pode ser preenchido depois no painel.">
              <input
                className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                value={form.storeBannerUrl}
                onChange={(event) => setForm((prev) => ({ ...prev, storeBannerUrl: event.target.value }))}
              />
            </HelpLabel>
            <HelpLabel label="Upload banner" help="Opcional. Se enviar arquivo, ele prevalece sobre a URL informada.">
              <input
                type="file"
                accept="image/*"
                className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                onChange={(event) => setStoreBannerFile(event.target.files?.[0] ?? null)}
              />
              {storeBannerFile ? (
                <p className="mt-1 text-xs text-[color:var(--brand-navy)]/70">
                  Arquivo selecionado: {storeBannerFile.name}
                </p>
              ) : null}
            </HelpLabel>
            <HelpLabel label="Logo URL" help="Opcional. Pode ser preenchido depois no painel.">
              <input
                className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                value={form.storeLogoUrl}
                onChange={(event) => setForm((prev) => ({ ...prev, storeLogoUrl: event.target.value }))}
              />
            </HelpLabel>
            <HelpLabel label="Upload icone/logo" help="Opcional. Se enviar arquivo, ele prevalece sobre a URL informada.">
              <input
                type="file"
                accept="image/*"
                className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                onChange={(event) => setStoreLogoFile(event.target.files?.[0] ?? null)}
              />
              {storeLogoFile ? (
                <p className="mt-1 text-xs text-[color:var(--brand-navy)]/70">
                  Arquivo selecionado: {storeLogoFile.name}
                </p>
              ) : null}
            </HelpLabel>
            <label className="flex items-center gap-2 text-xs text-[color:var(--brand-navy)]/70 md:col-span-2">
              <input
                type="checkbox"
                checked={form.storeHabilitaVerificacaoMesa}
                onChange={(event) => setForm((prev) => ({ ...prev, storeHabilitaVerificacaoMesa: event.target.checked }))}
              />
              Habilitar verificacao de mesa
            </label>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-4">
            {form.initialUsers.map((user, index) => (
              <article key={`initial-user-${index}`} className="rounded-xl border border-[color:var(--brand-navy)]/10 bg-[color:var(--brand-navy)]/5 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <HelpLabel label={`Nome do usuario ${index + 1}`} help="Nome exibido no painel.">
                    <input
                      className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                      value={user.nome}
                      onChange={(event) =>
                        setForm((prev) => {
                          const users = [...prev.initialUsers];
                          users[index] = { ...users[index], nome: event.target.value };
                          return { ...prev, initialUsers: users };
                        })
                      }
                    />
                  </HelpLabel>
                  <HelpLabel label={`E-mail do usuario ${index + 1}`} help="Usuario de login.">
                    <input
                      className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                      value={user.email}
                      onChange={(event) =>
                        setForm((prev) => {
                          const users = [...prev.initialUsers];
                          users[index] = { ...users[index], email: event.target.value };
                          return { ...prev, initialUsers: users };
                        })
                      }
                    />
                  </HelpLabel>
                  <HelpLabel label="Perfil base" help="Perfil inicial para o usuario.">
                    <select
                      className="rounded-xl border border-[color:var(--brand-navy)]/15 px-3 py-2"
                      value={user.roleKey}
                      onChange={(event) =>
                        setForm((prev) => {
                          const users = [...prev.initialUsers];
                          users[index] = { ...users[index], roleKey: event.target.value as "admin" | "cozinha" | "atendimento" };
                          return { ...prev, initialUsers: users };
                        })
                      }
                    >
                      <option value="admin">Admin</option>
                      <option value="cozinha">Cozinha</option>
                      <option value="atendimento">Atendimento</option>
                    </select>
                  </HelpLabel>
                </div>

                <p className="mt-3 text-xs font-semibold text-[color:var(--brand-navy)]/70">Permissoes</p>
                <div className="mt-2 grid gap-2 md:grid-cols-3">
                  {permissionOptions.map((permission) => (
                    <label key={permission} className="flex items-center gap-2 rounded-xl border border-[color:var(--brand-navy)]/10 bg-white px-3 py-2 text-xs">
                      <input
                        type="checkbox"
                        checked={user.permissions.includes(permission)}
                        onChange={(event) =>
                          setForm((prev) => {
                            const users = [...prev.initialUsers];
                            const current = users[index];
                            users[index] = {
                              ...current,
                              permissions: event.target.checked
                                ? [...current.permissions, permission]
                                : current.permissions.filter((item) => item !== permission),
                            };
                            return { ...prev, initialUsers: users };
                          })
                        }
                      />
                      {permission}
                    </label>
                  ))}
                </div>

                {index >= 3 ? (
                  <button
                    type="button"
                    className="mt-3 rounded-full border border-[color:var(--brand-red)]/30 px-3 py-1 text-xs text-[color:var(--brand-ink)]"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        initialUsers: prev.initialUsers.filter((_, itemIndex) => itemIndex !== index),
                      }))
                    }
                  >
                    Remover usuario extra
                  </button>
                ) : null}
              </article>
            ))}

            {form.initialUsers.length < 4 ? (
              <button
                type="button"
                className="rounded-full border border-[color:var(--brand-navy)]/25 px-4 py-2 text-xs font-semibold text-[color:var(--brand-ink)]"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    initialUsers: [
                      ...prev.initialUsers,
                      {
                        nome: "Operador",
                        email: "",
                        roleKey: "atendimento",
                        permissions: ["pedido.read", "pedido.update"],
                      },
                    ],
                  }))
                }
              >
                + Adicionar 1 usuario (maximo 4)
              </button>
            ) : null}
          </div>
        ) : null}

        {step === 4 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-[color:var(--brand-navy)]/10 p-4">
              <h3 className="text-sm font-semibold text-[color:var(--brand-ink)]">Tenant</h3>
              <p className="mt-2 text-xs">Nome: {form.tenantName}</p>
              <p className="mt-1 text-xs">Slug: {form.tenantSlug}</p>
              <p className="mt-1 text-xs">Status: {form.tenantActive ? "Ativo" : "Inativo"}</p>
              <p className="mt-1 text-xs">Dominio: {form.domain || "-"}</p>
              <p className="mt-1 text-xs">Subdominio: {form.subdomain || "-"}</p>
              <p className="mt-1 text-xs">Referencia externa: {form.externalRef || "-"}</p>
            </article>
            <article className="rounded-xl border border-[color:var(--brand-navy)]/10 p-4">
              <h3 className="text-sm font-semibold text-[color:var(--brand-ink)]">Provisionamento</h3>
              <p className="mt-2 text-xs">Plano: {form.planCode}</p>
              <p className="mt-1 text-xs">Licenca: {form.licenseStatus}</p>
              <p className="mt-1 text-xs">Loja no onboarding: {hasStoreData(form) ? "Preenchida" : "Nao preenchida"}</p>
              <p className="mt-1 text-xs">Usuarios: {form.initialUsers.length}</p>
            </article>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="rounded-xl border border-[color:var(--brand-green)]/30 bg-[color:var(--brand-green)]/10 p-4">
            <h3 className="text-sm font-semibold text-[color:var(--brand-ink)]">Finalizacao concluida</h3>
            <p className="mt-2 text-sm text-[color:var(--brand-ink)]">{resultMessage ?? "Tenant provisionado com sucesso."}</p>
            {createdUsers.length ? (
              <div className="mt-4 rounded-xl border border-[color:var(--brand-navy)]/10 bg-white p-3">
                <p className="text-xs font-semibold text-[color:var(--brand-ink)]">Credenciais geradas</p>
                <div className="mt-2 grid gap-2">
                  {createdUsers.map((user) => (
                    <div key={user.email} className="rounded-lg border border-[color:var(--brand-navy)]/10 p-2 text-xs">
                      <p><strong>Nome:</strong> {user.nome}</p>
                      <p><strong>Email:</strong> {user.email}</p>
                      <p><strong>Perfil:</strong> {user.role}</p>
                      <p><strong>Senha temporaria:</strong> {user.tempPassword}</p>
                      <p><strong>Troca obrigatoria:</strong> {user.forcePasswordChange ? "Sim, no primeiro login" : "Nao"}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <button
              type="button"
              onClick={restartWizard}
              className="mt-4 rounded-full bg-[color:var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white"
            >
              Criar outro tenant
            </button>
          </div>
        ) : null}

        {globalError ? <p className="mt-4 text-sm text-red-600">{globalError}</p> : null}

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {step > 0 && step < 4 ? (
            <button
              type="button"
              onClick={handleBack}
              className="rounded-full border border-[color:var(--brand-navy)]/25 px-4 py-2 text-xs font-semibold text-[color:var(--brand-ink)]"
            >
              Voltar
            </button>
          ) : null}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext}
              className="rounded-full bg-[color:var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {checkingSlug ? "Validando slug..." : "Proximo"}
            </button>
          ) : null}

          {step === 3 ? (
            <button
              type="button"
              onClick={handleFinish}
              disabled={isSubmitting}
              className="rounded-full bg-[color:var(--brand-navy)] px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Finalizando..." : "Finalizar criacao"}
            </button>
          ) : null}
        </div>
      </section>
    </PageShell>
  );
}
