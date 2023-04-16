import { MigrationInterface, QueryRunner } from 'typeorm';

export class initialMigration1631877153850 implements MigrationInterface {
  name = 'initialMigration1631877153850';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "product_to_order" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "quantity" integer NOT NULL, "amount" integer NOT NULL, "productId" integer, "orderId" integer, CONSTRAINT "PK_c8cdf4a201263c15f99994bba71" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "delivery" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "areaName" character varying, "cityName" character varying, "cityFullName" character varying, "cityRef" character varying, "streetName" character varying, "streetRef" character varying, CONSTRAINT "PK_ffad7bf84e68716cd9af89003b0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "orders_status_enum" AS ENUM('open', 'pending', 'paid', 'delivering', 'confirmed', 'completed', 'cancelled', 'reopened')`,
    );
    await queryRunner.query(
      `CREATE TABLE "orders" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "status" "orders_status_enum" NOT NULL DEFAULT 'open', "amount" integer, "additionalFirstName" character varying, "additionalLastName" character varying, "additionalEmail" character varying, "additionalNumber" character varying, "userId" integer, "deliveryId" integer, CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "likes" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "productId" integer, "userId" integer, CONSTRAINT "PK_a9323de3f8bced7539a794b4a37" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "roles" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "comment" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "text" character varying(500) NOT NULL, "authorId" integer, "productId" integer, CONSTRAINT "PK_0b0e4bbc8415ec426f87f3a88e2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "feedback" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "text" character varying(3000) NOT NULL, "authorIP" character varying, "authorId" integer, CONSTRAINT "PK_8389f9e087a57689cd5be8b2b13" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "ratings" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "currentRating" integer NOT NULL, "productId" integer, "userId" integer, CONSTRAINT "PK_0f31425b073219379545ad68ed9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "users_status_enum" AS ENUM('pending', 'confirmed', 'blocked')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "firstName" character varying, "lastName" character varying, "phoneNumber" character varying, "email" character varying NOT NULL, "password" character varying, "dateOfBirth" TIMESTAMP, "googleId" character varying, "facebookId" character varying, "status" "users_status_enum" NOT NULL DEFAULT 'pending', "telegramId" character varying, "roleId" integer, "avatarId" integer, "deliveryId" integer, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "REL_3e1f52ec904aed992472f2be14" UNIQUE ("avatarId"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "slides" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "text" character varying NOT NULL, "image" character varying NOT NULL, "href" character varying NOT NULL, "isShown" boolean NOT NULL, "priority" integer NOT NULL, CONSTRAINT "PK_7907bb06ab78980c123912f7a7a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "files" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "productId" integer, "slideId" integer, CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "characteristicGroup" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "categoryId" integer, CONSTRAINT "PK_c714e47f0f08f13eb6bc28ec2f3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "characteristics_type_enum" AS ENUM('enum', 'string', 'number', 'boolean', 'json', 'date', 'range')`,
    );
    await queryRunner.query(
      `CREATE TABLE "characteristics" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "description" character varying NOT NULL, "required" boolean NOT NULL DEFAULT false, "type" "characteristics_type_enum" NOT NULL, "defaultValues" json, "minValue" integer, "maxValue" integer, "categoryId" integer, "groupId" integer, CONSTRAINT "PK_a64133a287a0f2d735da40fcd89" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "characteristicsValues_type_enum" AS ENUM('enum', 'string', 'number', 'boolean', 'json', 'date', 'range')`,
    );
    await queryRunner.query(
      `CREATE TABLE "characteristicsValues" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "type" "characteristicsValues_type_enum" NOT NULL, "stringValue" character varying, "numberValue" integer, "enumValue" text, "booleanValue" boolean, "jsonValue" jsonb, "dateValue" date, "productId" integer, "characteristicId" integer, CONSTRAINT "PK_8978f8334d5c541aa9b03d08429" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "key" character varying, "description" character varying, "price" integer NOT NULL, "availability" boolean NOT NULL DEFAULT false, "url" character varying NOT NULL, "disabled" boolean NOT NULL DEFAULT false, "avgRating" numeric(10,1) NOT NULL DEFAULT '0', "shopKey" character varying, "categoryId" integer, "mainImgId" integer, CONSTRAINT "UQ_0f659c9759b7cc35e2103599df8" UNIQUE ("key"), CONSTRAINT "REL_6df03e348bd527ee151c9f6c3c" UNIQUE ("mainImgId"), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "key" character varying NOT NULL, "description" character varying NOT NULL, "mpath" character varying DEFAULT '', "parentId" integer, CONSTRAINT "UQ_da6f1e4e0c4683302df95d3ae9c" UNIQUE ("key"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "parameters" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "settings" jsonb NOT NULL, CONSTRAINT "UQ_2175a3ea1bb4faec90245b47418" UNIQUE ("name"), CONSTRAINT "PK_6b03a26baa3161f87fa87588859" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "confirmation-token" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" integer NOT NULL, "token" character varying NOT NULL, CONSTRAINT "PK_02cc38ae660107d5a52dbac992a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_to_order" ADD CONSTRAINT "FK_9a4a5afa8072e977f6cf5751dd8" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_to_order" ADD CONSTRAINT "FK_37a14f7472c66e24dd48688869a" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_151b79a83ba240b0cb31b2302d1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_0dddcc76db9733e86e566e5e632" FOREIGN KEY ("deliveryId") REFERENCES "delivery"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "likes" ADD CONSTRAINT "FK_36096625e9a713d7b1f8d34eea0" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "likes" ADD CONSTRAINT "FK_cfd8e81fac09d7339a32e57d904" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comment" ADD CONSTRAINT "FK_276779da446413a0d79598d4fbd" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "comment" ADD CONSTRAINT "FK_1e9f24a68bd2dcd6390a4008395" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback" ADD CONSTRAINT "FK_dcb65439124a7d17475aaf8588e" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratings" ADD CONSTRAINT "FK_abcea824a43708933e5ac15a0e4" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratings" ADD CONSTRAINT "FK_4d0b0e3a4c4af854d225154ba40" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_368e146b785b574f42ae9e53d5e" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_3e1f52ec904aed992472f2be147" FOREIGN KEY ("avatarId") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_95b82d039fffcde2cdb8b977097" FOREIGN KEY ("deliveryId") REFERENCES "delivery"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ADD CONSTRAINT "FK_57a86e1cc8eae915977547fdaeb" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ADD CONSTRAINT "FK_c2db8d14120e5c52f8a9a16b1cb" FOREIGN KEY ("slideId") REFERENCES "slides"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "characteristicGroup" ADD CONSTRAINT "FK_e761142daa4850c102904170703" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "characteristics" ADD CONSTRAINT "FK_8d9977fbcd66aacfe61bc426265" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "characteristics" ADD CONSTRAINT "FK_b01212d68518315fd5a267b4b96" FOREIGN KEY ("groupId") REFERENCES "characteristicGroup"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "characteristicsValues" ADD CONSTRAINT "FK_5ed77bc316701d98e820f73f904" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "characteristicsValues" ADD CONSTRAINT "FK_1748818121af09358e56a386b4d" FOREIGN KEY ("characteristicId") REFERENCES "characteristics"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_ff56834e735fa78a15d0cf21926" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_6df03e348bd527ee151c9f6c3cf" FOREIGN KEY ("mainImgId") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_9a6f051e66982b5f0318981bcaa" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "FK_9a6f051e66982b5f0318981bcaa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_6df03e348bd527ee151c9f6c3cf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_ff56834e735fa78a15d0cf21926"`,
    );
    await queryRunner.query(
      `ALTER TABLE "characteristicsValues" DROP CONSTRAINT "FK_1748818121af09358e56a386b4d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "characteristicsValues" DROP CONSTRAINT "FK_5ed77bc316701d98e820f73f904"`,
    );
    await queryRunner.query(
      `ALTER TABLE "characteristics" DROP CONSTRAINT "FK_b01212d68518315fd5a267b4b96"`,
    );
    await queryRunner.query(
      `ALTER TABLE "characteristics" DROP CONSTRAINT "FK_8d9977fbcd66aacfe61bc426265"`,
    );
    await queryRunner.query(
      `ALTER TABLE "characteristicGroup" DROP CONSTRAINT "FK_e761142daa4850c102904170703"`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" DROP CONSTRAINT "FK_c2db8d14120e5c52f8a9a16b1cb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" DROP CONSTRAINT "FK_57a86e1cc8eae915977547fdaeb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_95b82d039fffcde2cdb8b977097"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_3e1f52ec904aed992472f2be147"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_368e146b785b574f42ae9e53d5e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratings" DROP CONSTRAINT "FK_4d0b0e3a4c4af854d225154ba40"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratings" DROP CONSTRAINT "FK_abcea824a43708933e5ac15a0e4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback" DROP CONSTRAINT "FK_dcb65439124a7d17475aaf8588e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comment" DROP CONSTRAINT "FK_1e9f24a68bd2dcd6390a4008395"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comment" DROP CONSTRAINT "FK_276779da446413a0d79598d4fbd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "likes" DROP CONSTRAINT "FK_cfd8e81fac09d7339a32e57d904"`,
    );
    await queryRunner.query(
      `ALTER TABLE "likes" DROP CONSTRAINT "FK_36096625e9a713d7b1f8d34eea0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_0dddcc76db9733e86e566e5e632"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_151b79a83ba240b0cb31b2302d1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_to_order" DROP CONSTRAINT "FK_37a14f7472c66e24dd48688869a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_to_order" DROP CONSTRAINT "FK_9a4a5afa8072e977f6cf5751dd8"`,
    );
    await queryRunner.query(`DROP TABLE "confirmation-token"`);
    await queryRunner.query(`DROP TABLE "parameters"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "characteristicsValues"`);
    await queryRunner.query(`DROP TYPE "characteristicsValues_type_enum"`);
    await queryRunner.query(`DROP TABLE "characteristics"`);
    await queryRunner.query(`DROP TYPE "characteristics_type_enum"`);
    await queryRunner.query(`DROP TABLE "characteristicGroup"`);
    await queryRunner.query(`DROP TABLE "files"`);
    await queryRunner.query(`DROP TABLE "slides"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "users_status_enum"`);
    await queryRunner.query(`DROP TABLE "ratings"`);
    await queryRunner.query(`DROP TABLE "feedback"`);
    await queryRunner.query(`DROP TABLE "comment"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TABLE "likes"`);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TYPE "orders_status_enum"`);
    await queryRunner.query(`DROP TABLE "delivery"`);
    await queryRunner.query(`DROP TABLE "product_to_order"`);
  }
}
