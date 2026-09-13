import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize } from 'sequelize';
import type { DbModels } from './registry';

export class AcademicYear extends Model<InferAttributes<AcademicYear>, InferCreationAttributes<AcademicYear>> {
  declare id: CreationOptional<number>;
  declare label: string;
  declare isActive: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static associate(models: DbModels): void {
    AcademicYear.hasMany(models.Class, { foreignKey: 'academicYearId', as: 'classes' });
    AcademicYear.hasMany(models.Exam, { foreignKey: 'academicYearId', as: 'exams' });
    AcademicYear.hasMany(models.StudentEnrollment, { foreignKey: 'academicYearId', as: 'enrollments' });
    AcademicYear.hasMany(models.TeachingAssignment, { foreignKey: 'academicYearId', as: 'assignments' });
    AcademicYear.hasMany(models.Mark, { foreignKey: 'academicYearId', as: 'marks' });
  }
}

export const initAcademicYear = (sequelize: Sequelize): typeof AcademicYear => {
  AcademicYear.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      label: { type: DataTypes.STRING(20), allowNull: false, unique: true },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    { sequelize, tableName: 'academic_years' }
  );
  return AcademicYear;
};
