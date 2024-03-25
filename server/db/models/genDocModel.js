module.exports = (sequelize, Sequelize) => {
    const gen_document = sequelize.define(
      "gen_document",
      {
        gen_id: {
          type: Sequelize.INTEGER(11),
          primaryKey: true,
          autoInclement: true,
          field: "gen_id",
        },
        doc_nonlicense: {
          type: Sequelize.STRING(100),
          allowNull: true,
          field: "doc_nonlicense",
        },
        courtesy_license: {
          type: Sequelize.STRING(100),
          allowNull: true,
          field: "courtesy_license",
        },
        intern_letter: {
          type: Sequelize.STRING(100),
          allowNull: true,
          field: "intern_letter",
        },
        date_gen: {
          type: Sequelize.DATE(),
          allowNull: false,
          defaultValue: Sequelize.NOW(),
          field: "date_gen",
        },
        academic_year: {
          type: Sequelize.STRING(50),
          allowNull: false,
          field: "academic_year",
        }
      },
      {
        tableName: "gen_document",
      }
    );
    return gen_document;
  };
  