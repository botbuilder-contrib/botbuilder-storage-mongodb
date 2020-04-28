export class MongoDbStorageError extends Error {
  public static readonly NO_CONFIG_ERROR: MongoDbStorageError = new MongoDbStorageError('MongoDbStorageConfig is required.');
  public static readonly NO_URL_ERROR: MongoDbStorageError = new MongoDbStorageError('MongoDbStorageConfig.url is required.');
}
