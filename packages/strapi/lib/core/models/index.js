const yup = require('yup');

const optionsSchema = yup.object().shape({
  increments: yup.boolean().default(true),
  timestamps: yup
    .mixed()
    .when({
      is: value => value === true || value === false,
      then: yup.boolean().required(),
      otherwise: yup
        .array()
        .min(2)
        .max(2)
        .of(yup.string())
        .required(),
    })
    .required(),
});

const modelValidationSchema = yup.object().shape({
  connection: yup.string().required(),
  collectionName: yup.string().required(),
  options: optionsSchema.required(),
});

const createModel = ({ schema }) => {
  return {
    schema,
  };
};

const createManager = models => {
  const modelsMap = new Map();

  models.forEach(modelInfo => {
    const { key, schema } = modelInfo;

    // validate schema
    modelValidationSchema.validateSync(schema);

    const model = createModel({
      schema,
    });

    modelsMap.set(key, model);
  });

  // build relations between models

  return {
    get(key) {
      return modelsMap.get(key);
    },
    keys() {
      return modelsMap.keys();
    },
    // graph traversal methods
  };
};

const buildModelsManager = ({ api: apis, admin, plugins }) => {
  let modelsInfos = [];

  Object.entries(plugins).forEach(([pluginKey, plugin]) => {
    if (!plugin.models) {
      return;
    }

    Object.entries(plugin.models).forEach(([modelKey, schema]) => {
      modelsInfos.push({
        key: `${pluginKey}.${modelKey}`,
        schema,
      });
    });
  });

  if (admin.models) {
    Object.entries(admin.models).forEach(([modelKey, schema]) => {
      modelsInfos.push({
        key: `admin.${modelKey}`,
        schema,
      });
    });
  }

  Object.entries(apis).forEach(([apiKey, api]) => {
    if (!api.models) {
      return;
    }

    Object.entries(api.models).forEach(([modelKey, schema]) => {
      modelsInfos.push({
        key: `${apiKey}.${modelKey}`,
        schema,
      });
    });
  });

  return createManager(modelsInfos);
};

module.exports = {
  buildModelsManager,
};
