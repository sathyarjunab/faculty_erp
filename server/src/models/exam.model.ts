import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize } from 'sequelize';
import type { DbModels } from './registry';

export class Exam extends Model<InferAttributes<Exam>, InferCreationAttributes<Exam>> {
  declare id: CreationOptional<number>;
  declare classId: number;
  declare academicYearId: number;
  declare name: string;
  declare sequence: CreationOptional<number>;
  declare maxMarks: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static associate(models: DbModels): void {
    Exam.belongsTo(models.Class, { foreignKey: 'classId', as: 'klass' });
    Exam.belongsTo(models.AcademicYear, { foreignKey: 'academicYearId', as: 'academicYear' });
    Exam.hasMany(models.Mark, { foreignKey: 'examId', as: 'marks' });
  }
}

export const initExam = (sequelize: Sequelize): typeof Exam => {
  Exam.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      classId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      academicYearId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      name: { type: DataTypes.STRING(60), allowNull: false },
      sequence: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, defaultValue: 1 },
      maxMarks: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: 'exams',
      indexes: [
        { unique: true, fields: ['class_id', 'name', 'academic_year_id'] },
        { fields: ['class_id', 'academic_year_id'] },
      ],
    }
  );
  return Exam;
};
