import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize } from 'sequelize';
import type { DbModels } from './registry';
import type { StudentEnrollment } from './studentEnrollment.model';
import type { Subject } from './subject.model';
import type { Exam } from './exam.model';
import type { Teacher } from './teacher.model';

export class ScoreChangeLog extends Model<
  InferAttributes<ScoreChangeLog>,
  InferCreationAttributes<ScoreChangeLog>
> {
  declare id: CreationOptional<number>;
  declare markId: number;
  declare teacherId: number;
  declare enrollmentId: number;
  declare subjectId: number;
  declare examId: number;
  declare oldScore: CreationOptional<number | null>;
  declare newScore: CreationOptional<number | null>;
  declare oldIsAbsent: CreationOptional<boolean | null>;
  declare newIsAbsent: CreationOptional<boolean | null>;
  declare action: 'create' | 'update';
  declare createdAt: CreationOptional<Date>;

  // Eager-loaded associations.
  declare enrollment?: StudentEnrollment;
  declare subject?: Subject;
  declare exam?: Exam;
  declare teacher?: Teacher;

  static associate(models: DbModels): void {
    ScoreChangeLog.belongsTo(models.Mark, { foreignKey: 'markId', as: 'mark' });
    ScoreChangeLog.belongsTo(models.Teacher, { foreignKey: 'teacherId', as: 'teacher' });
    ScoreChangeLog.belongsTo(models.StudentEnrollment, { foreignKey: 'enrollmentId', as: 'enrollment' });
    ScoreChangeLog.belongsTo(models.Subject, { foreignKey: 'subjectId', as: 'subject' });
    ScoreChangeLog.belongsTo(models.Exam, { foreignKey: 'examId', as: 'exam' });
  }
}

const numberGetter = (field: 'oldScore' | 'newScore') =>
  function get(this: ScoreChangeLog): number | null {
    const raw = this.getDataValue(field);
    return raw === null || raw === undefined ? null : Number(raw);
  };

export const initScoreChangeLog = (sequelize: Sequelize): typeof ScoreChangeLog => {
  ScoreChangeLog.init(
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      markId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      teacherId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      enrollmentId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      subjectId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      examId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      oldScore: { type: DataTypes.DECIMAL(6, 2), allowNull: true, get: numberGetter('oldScore') },
      newScore: { type: DataTypes.DECIMAL(6, 2), allowNull: true, get: numberGetter('newScore') },
      oldIsAbsent: { type: DataTypes.BOOLEAN, allowNull: true },
      newIsAbsent: { type: DataTypes.BOOLEAN, allowNull: true },
      action: { type: DataTypes.ENUM('create', 'update'), allowNull: false },
      createdAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: 'score_change_logs',
      updatedAt: false,
      indexes: [
        { fields: ['teacher_id', 'created_at'] },
        { fields: ['mark_id'] },
      ],
    }
  );
  return ScoreChangeLog;
};
