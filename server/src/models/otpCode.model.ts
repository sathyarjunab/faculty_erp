import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize } from 'sequelize';

export class OtpCode extends Model<InferAttributes<OtpCode>, InferCreationAttributes<OtpCode>> {
  declare id: CreationOptional<number>;
  declare email: string;
  declare codeHash: string;
  declare purpose: CreationOptional<'login' | 'signup'>;
  declare expiresAt: Date;
  declare attempts: CreationOptional<number>;
  declare consumedAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export const initOtpCode = (sequelize: Sequelize): typeof OtpCode => {
  OtpCode.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      email: { type: DataTypes.STRING(160), allowNull: false },
      codeHash: { type: DataTypes.STRING(255), allowNull: false },
      purpose: { type: DataTypes.ENUM('login', 'signup'), allowNull: false, defaultValue: 'login' },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      attempts: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 },
      consumedAt: { type: DataTypes.DATE, allowNull: true },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: 'otp_codes',
      indexes: [{ fields: ['email'] }, { fields: ['expires_at'] }],
    }
  );
  return OtpCode;
};
