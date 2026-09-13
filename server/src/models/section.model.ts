import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize } from 'sequelize';
import type { DbModels } from './registry';
import type { ClassModel } from './class.model';
import type { Teacher } from './teacher.model';

export class Section extends Model<InferAttributes<Section>, InferCreationAttributes<Section>> {
  declare id: CreationOptional<number>;
  declare classId: number;
  declare name: string;
  // Homeroom / class-teacher of this section (nullable). A teacher may head many sections.
  declare classTeacherId: CreationOptional<number | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Eager-loaded associations.
  declare klass?: ClassModel;
  declare classTeacher?: Teacher | null;

  static associate(models: DbModels): void {
    Section.belongsTo(models.Class, { foreignKey: 'classId', as: 'klass' });
    Section.belongsTo(models.Teacher, { foreignKey: 'classTeacherId', as: 'classTeacher' });
    Section.hasMany(models.StudentEnrollment, { foreignKey: 'sectionId', as: 'enrollments' });
    Section.hasMany(models.TeachingAssignment, { foreignKey: 'sectionId', as: 'assignments' });
  }
}

export const initSection = (sequelize: Sequelize): typeof Section => {
  Section.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      classId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      name: { type: DataTypes.STRING(10), allowNull: false },
      classTeacherId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: 'sections',
      indexes: [
        { unique: true, fields: ['class_id', 'name'] },
        { fields: ['class_teacher_id'] },
      ],
    }
  );
  return Section;
};
