import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize } from 'sequelize';
import type { DbModels } from './registry';
import type { Student } from './student.model';

export class StudentEnrollment extends Model<
  InferAttributes<StudentEnrollment>,
  InferCreationAttributes<StudentEnrollment>
> {
  declare id: CreationOptional<number>;
  declare studentId: number;
  declare classId: number;
  declare sectionId: number;
  declare rollNo: string;
  declare academicYearId: number;
  declare status: CreationOptional<'active' | 'promoted' | 'left'>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Eager-loaded association.
  declare student?: Student;

  static associate(models: DbModels): void {
    StudentEnrollment.belongsTo(models.Student, { foreignKey: 'studentId', as: 'student' });
    StudentEnrollment.belongsTo(models.Class, { foreignKey: 'classId', as: 'klass' });
    StudentEnrollment.belongsTo(models.Section, { foreignKey: 'sectionId', as: 'section' });
    StudentEnrollment.belongsTo(models.AcademicYear, { foreignKey: 'academicYearId', as: 'academicYear' });
    StudentEnrollment.hasMany(models.Mark, { foreignKey: 'enrollmentId', as: 'marks' });
  }
}

export const initStudentEnrollment = (sequelize: Sequelize): typeof StudentEnrollment => {
  StudentEnrollment.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      studentId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      classId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      sectionId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      rollNo: { type: DataTypes.STRING(20), allowNull: false },
      academicYearId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      status: { type: DataTypes.ENUM('active', 'promoted', 'left'), allowNull: false, defaultValue: 'active' },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: 'student_enrollments',
      indexes: [
        { unique: true, fields: ['student_id', 'academic_year_id'] },
        { unique: true, fields: ['section_id', 'roll_no', 'academic_year_id'] },
        { fields: ['section_id', 'academic_year_id'] },
      ],
    }
  );
  return StudentEnrollment;
};
