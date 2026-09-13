import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize } from 'sequelize';
import type { DbModels } from './registry';
import type { Section } from './section.model';
import type { Subject } from './subject.model';

export class TeachingAssignment extends Model<
  InferAttributes<TeachingAssignment>,
  InferCreationAttributes<TeachingAssignment>
> {
  declare id: CreationOptional<number>;
  declare teacherId: number;
  declare subjectId: number;
  declare sectionId: number;
  declare academicYearId: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Eager-loaded associations.
  declare section?: Section;
  declare subject?: Subject;

  static associate(models: DbModels): void {
    TeachingAssignment.belongsTo(models.Teacher, { foreignKey: 'teacherId', as: 'teacher' });
    TeachingAssignment.belongsTo(models.Subject, { foreignKey: 'subjectId', as: 'subject' });
    TeachingAssignment.belongsTo(models.Section, { foreignKey: 'sectionId', as: 'section' });
    TeachingAssignment.belongsTo(models.AcademicYear, { foreignKey: 'academicYearId', as: 'academicYear' });
  }
}

export const initTeachingAssignment = (sequelize: Sequelize): typeof TeachingAssignment => {
  TeachingAssignment.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      teacherId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      subjectId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      sectionId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      academicYearId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: 'teaching_assignments',
      indexes: [
        { unique: true, fields: ['subject_id', 'section_id', 'academic_year_id'] },
        { fields: ['teacher_id', 'academic_year_id'] },
      ],
    }
  );
  return TeachingAssignment;
};
