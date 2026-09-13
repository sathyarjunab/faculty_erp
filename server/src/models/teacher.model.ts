import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize } from 'sequelize';
import type { DbModels } from './registry';

export class Teacher extends Model<InferAttributes<Teacher>, InferCreationAttributes<Teacher>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare email: string;
  declare passwordHash: CreationOptional<string | null>;
  declare googleId: CreationOptional<string | null>;
  declare emailVerified: CreationOptional<boolean>;
  declare dept: CreationOptional<string | null>;
  declare photoUrl: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static associate(models: DbModels): void {
    Teacher.hasMany(models.TeachingAssignment, { foreignKey: 'teacherId', as: 'assignments' });
    Teacher.hasMany(models.Mark, { foreignKey: 'teacherId', as: 'marks' });
    Teacher.hasMany(models.ScoreChangeLog, { foreignKey: 'teacherId', as: 'logs' });
    Teacher.hasMany(models.Section, { foreignKey: 'classTeacherId', as: 'homerooms' });
  }
}

export const initTeacher = (sequelize: Sequelize): typeof Teacher => {
  Teacher.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      email: { type: DataTypes.STRING(160), allowNull: false, unique: true, validate: { isEmail: true } },
      passwordHash: { type: DataTypes.STRING(255), allowNull: true },
      googleId: { type: DataTypes.STRING(80), allowNull: true, unique: true },
      emailVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      dept: { type: DataTypes.STRING(120), allowNull: true },
      photoUrl: { type: DataTypes.STRING(255), allowNull: true },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: 'teachers',
      defaultScope: { attributes: { exclude: ['passwordHash'] } },
      scopes: {
        withSecret: { attributes: { include: ['passwordHash'] } },
      },
    }
  );
  return Teacher;
};
