import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize } from 'sequelize';
import type { DbModels } from './registry';

export class Mark extends Model<InferAttributes<Mark>, InferCreationAttributes<Mark>> {
  declare id: CreationOptional<number>;
  declare enrollmentId: number;
  declare subjectId: number;
  declare examId: number;
  declare score: CreationOptional<number | null>;
  declare isAbsent: CreationOptional<boolean>;
  declare teacherId: number;
  declare academicYearId: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static associate(models: DbModels): void {
    Mark.belongsTo(models.StudentEnrollment, { foreignKey: 'enrollmentId', as: 'enrollment' });
    Mark.belongsTo(models.Subject, { foreignKey: 'subjectId', as: 'subject' });
    Mark.belongsTo(models.Exam, { foreignKey: 'examId', as: 'exam' });
    Mark.belongsTo(models.Teacher, { foreignKey: 'teacherId', as: 'teacher' });
    Mark.belongsTo(models.AcademicYear, { foreignKey: 'academicYearId', as: 'academicYear' });
    Mark.hasMany(models.ScoreChangeLog, { foreignKey: 'markId', as: 'logs' });
  }
}

export const initMark = (sequelize: Sequelize): typeof Mark => {
  Mark.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      enrollmentId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      subjectId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      examId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      score: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: true,
        // DECIMAL comes back as a string from MySQL; normalize to number|null.
        get(this: Mark): number | null {
          const raw = this.getDataValue('score');
          return raw === null || raw === undefined ? null : Number(raw);
        },
      },
      isAbsent: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      teacherId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      academicYearId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: 'marks',
      indexes: [
        { unique: true, fields: ['enrollment_id', 'subject_id', 'exam_id'] },
        { fields: ['subject_id', 'exam_id'] },
        { fields: ['exam_id'] },
      ],
    }
  );
  return Mark;
};
