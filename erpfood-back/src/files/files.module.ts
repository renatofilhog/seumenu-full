import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileObject } from './entities/file-object.entity';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  imports: [TypeOrmModule.forFeature([FileObject])],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
