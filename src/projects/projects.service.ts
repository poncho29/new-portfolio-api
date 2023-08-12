import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { validate as isUUID } from 'uuid';

import { Project } from './entities/project.entity';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async create(createProjectDto: CreateProjectDto) {
    try {
      const project = this.projectRepository.create(createProjectDto);

      await this.projectRepository.save(project);
      return project;
    } catch (error) {
      this.handleDbException(error);
    }
  }

  async findAll(pagination: PaginationDto) {
    const { limit = 10, offset = 0 } = pagination;

    return await this.projectRepository.find({
      take: limit,
      skip: offset,
    });
  }

  async findOne(term: string) {
    // Find by uuid, title or slug
    let project: Project;

    if (isUUID(term)) {
      project = await this.projectRepository.findOneBy({ id: term });
    } else {
      const queryBuilder = this.projectRepository.createQueryBuilder();
      project = await queryBuilder
        .where(`UPPER(title)=:title or slug= :slug`, {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
        })
        .getOne();
    }

    if (!project) {
      throw new NotFoundException(`Project with id ${term} not found`);
    }

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    // El preload busca y prepare el objeto para la actualizacion
    const project = await this.projectRepository.preload({
      id: id,
      ...updateProjectDto,
    });

    if (!project)
      throw new NotFoundException(`Project with id ${id} not found`);

    try {
      await this.projectRepository.save(project);
      return project;
    } catch (error) {
      this.handleDbException(error);
    }
  }

  async remove(id: string) {
    const project = await this.findOne(id);

    await this.projectRepository.remove(project);

    return { message: 'Project deleted' };
  }

  private handleDbException(error: any) {
    if (error.code === '23505') {
      throw new BadRequestException(error.detail);
    }

    this.logger.error(error);
    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }
}
