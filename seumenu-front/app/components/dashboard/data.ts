export const accessModules = [
  {
    title: "Usuarios",
    description: "Crie, edite e gerencie contas da equipe.",
    stats: "42 ativos",
  },
  {
    title: "Papeis (Roles)",
    description: "Defina perfis de acesso por funcao.",
    stats: "6 papeis",
  },
  {
    title: "Permissoes",
    description: "Controle granular por modulo e acao.",
    stats: "28 regras",
  },
];

export const menuModules = [
  {
    title: "Grupos de Produtos",
    description: "Organize o cardapio por categorias e ordem.",
    stats: "9 grupos",
  },
  {
    title: "Produtos",
    description: "Gerencie itens, precos, imagem e disponibilidade.",
    stats: "124 itens",
  },
  {
    title: "Adicionais",
    description: "Defina complementos, limites e valores.",
    stats: "31 adicionais",
  },
];

export const mesas = [
  { numero: "12", setor: "Salao", status: "Ativa" },
  { numero: "07", setor: "Varanda", status: "Ativa" },
  { numero: "03", setor: "VIP", status: "Inativa" },
];

export const pedidos = [
  {
    id: "#3098",
    mesa: "Mesa 12",
    valor: "R$ 186,40",
    status: "Em analise",
    hora: "12:42",
  },
  {
    id: "#3099",
    mesa: "Mesa 07",
    valor: "R$ 94,90",
    status: "Preparando",
    hora: "12:44",
  },
  {
    id: "#3100",
    mesa: "Mesa 03",
    valor: "R$ 221,10",
    status: "Feito",
    hora: "12:46",
  },
];

export const kanban = {
  "Em analise": [
    {
      id: "#3098",
      mesa: "Mesa 12",
      itens: "2 pizzas, 1 suco",
      total: "R$ 186,40",
    },
  ],
  Preparando: [
    {
      id: "#3099",
      mesa: "Mesa 07",
      itens: "1 massa, 2 aguas",
      total: "R$ 94,90",
    },
    {
      id: "#3101",
      mesa: "Mesa 05",
      itens: "3 burgers, 1 batata",
      total: "R$ 178,70",
    },
  ],
  Feito: [
    {
      id: "#3100",
      mesa: "Mesa 03",
      itens: "1 combo executivo",
      total: "R$ 221,10",
    },
  ],
} as const;
