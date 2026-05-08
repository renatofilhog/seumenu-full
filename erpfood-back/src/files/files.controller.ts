import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestTenant } from 'src/tenant/types/request-tenant.type';
import { FilesService } from './files.service';

type FileRequest = Request & {
  user?: JwtPayload;
  tenant?: RequestTenant;
};

@ApiTags('files')
@ApiBearerAuth()
@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiOkResponse()
  upload(@UploadedFile() file: Express.Multer.File, @Req() req: FileRequest) {
    return this.filesService.upload(file, {
      user: req.user,
      tenant: req.tenant,
    });
  }

  @Get(':id')
  @ApiOkResponse()
  findById(@Param('id', ParseIntPipe) id: number, @Req() req: FileRequest) {
    return this.filesService.findById(id, {
      user: req.user,
      tenant: req.tenant,
    });
  }

  @Get(':id/download')
  async download(@Param('id', ParseIntPipe) id: number, @Req() req: FileRequest, @Res() res: any) {
    const data = await this.filesService.getDownloadData(id, {
      user: req.user,
      tenant: req.tenant,
    });
    if (data.object.contentType) {
      res.setHeader('Content-Type', data.object.contentType);
    }
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(data.file.originalFilename)}"`);
    data.object.stream.pipe(res);
  }

  @Delete(':id')
  @ApiOkResponse()
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: FileRequest) {
    return this.filesService.deleteById(id, {
      user: req.user,
      tenant: req.tenant,
    });
  }
}
