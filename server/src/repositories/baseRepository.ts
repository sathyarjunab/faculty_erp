import {
  Model,
  ModelStatic,
  Attributes,
  CreationAttributes,
  FindOptions,
  CreateOptions,
  BulkCreateOptions,
  UpdateOptions,
  DestroyOptions,
  CountOptions,
} from 'sequelize';

/**
 * Generic repository factory.
 * Given a Sequelize model, returns typed CRUD methods.
 * Domain repositories compose this and add their own finders.
 * The model is the only Sequelize surface exposed to upper layers.
 */
export const makeBaseRepository = <M extends Model>(model: ModelStatic<M>) => ({
  model,

  create: (data: CreationAttributes<M>, options?: CreateOptions<Attributes<M>>): Promise<M> =>
    model.create(data, options),

  bulkCreate: (rows: CreationAttributes<M>[], options?: BulkCreateOptions<Attributes<M>>): Promise<M[]> =>
    model.bulkCreate(rows, options),

  findByPk: (id: number, options?: Omit<FindOptions<Attributes<M>>, 'where'>): Promise<M | null> =>
    model.findByPk(id, options),

  findOne: (options?: FindOptions<Attributes<M>>): Promise<M | null> => model.findOne(options),

  findAll: (options?: FindOptions<Attributes<M>>): Promise<M[]> => model.findAll(options),

  findAndCountAll: (options?: FindOptions<Attributes<M>>): Promise<{ rows: M[]; count: number }> =>
    model.findAndCountAll(options) as Promise<{ rows: M[]; count: number }>,

  count: (options?: CountOptions<Attributes<M>>): Promise<number> => model.count(options),

  update: (values: Partial<Attributes<M>>, options: UpdateOptions<Attributes<M>>): Promise<[number]> =>
    model.update(values, options),

  destroy: (options?: DestroyOptions<Attributes<M>>): Promise<number> => model.destroy(options),
});
