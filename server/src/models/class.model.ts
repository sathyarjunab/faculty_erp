import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize } from 'sequelize';
import type { DbModels } from './registry';

/** Exported as ClassModel because `Class` collides with the DOM/global lib name. */
export class ClassModel extends Model<InferAttributes<ClassModel>, InferCreationAttributes<ClassModel>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare academicYearId: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static associate(models: DbModels): void {
    ClassModel.belongsTo(models.AcademicYear, { foreignKey: 'academicYearId', as: 'academicYear' });
    ClassModel.hasMany(models.Section, { foreignKey: 'classId', as: 'sections' });
    ClassModel.hasMany(models.Exam, { foreignKey: 'classId', as: 'exams' });
    ClassModel.hasMany(models.StudentEnrollment, { foreignKey: 'classId', as: 'enrollments' });
  }
}

export const initClass = (sequelize: Sequelize): typeof ClassModel => {
  ClassModel.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(60), allowNull: false },
      academicYearId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: 'classes',
      indexes: [{ unique: true, fields: ['name', 'academic_year_id'] }],
    }
  );
  return ClassModel;
};
