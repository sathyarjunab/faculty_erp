import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize } from 'sequelize';
import type { DbModels } from './registry';

export class Student extends Model<InferAttributes<Student>, InferCreationAttributes<Student>> {
  declare id: CreationOptional<number>;
  declare admissionNo: string;
  declare name: string;
  declare gender: CreationOptional<'male' | 'female' | 'other' | null>;
  declare dob: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static associate(models: DbModels): void {
    Student.hasMany(models.StudentEnrollment, { foreignKey: 'studentId', as: 'enrollments' });
  }
}

export const initStudent = (sequelize: Sequelize): typeof Student => {
  Student.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      admissionNo: { type: DataTypes.STRING(30), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      gender: { type: DataTypes.ENUM('male', 'female', 'other'), allowNull: true },
      dob: { type: DataTypes.DATEONLY, allowNull: true },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    { sequelize, tableName: 'students' }
  );
  return Student;
};
