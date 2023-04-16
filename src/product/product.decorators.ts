import { applyDecorators } from "@nestjs/common";
import { ApiInternalServerErrorResponse, ApiOkResponse, getSchemaPath } from "@nestjs/swagger";
import { PaginatedAdminProductsDto } from "./dto/paginatedProducts.dto";
import { Product } from "./product.entity";

export const ApiAdminProductResponse = () => {
    return applyDecorators(
      ApiOkResponse({
        schema: {
          allOf: [
            { $ref: getSchemaPath(PaginatedAdminProductsDto) },
            {
              properties: {
                data: {
                  type: 'array',
                  items: { $ref: getSchemaPath(Product) },
                },
                count: {
                  type: 'number',
                  description: 'Кількість товарів',
                  example: '500',
                },
                totalPages: {
                  type: 'number',
                  description: 'Кількість сторінок',
                  example: '20',
                },
                priceRange: {
                  type: 'object',
                  description: 'Діапазони ціни загальний і обраний',
                  properties: {
                    max: {
                      type: 'number',
                      description: 'Максимальна ціна відфільтрованих товарів',
                      example: '200',
                    },
                    min: {
                      type: 'number',
                      description: 'Мінімальна ціна відфільтрованих товарів',
                      example: '20',
                    },
                    absoluteMax: {
                      type: 'number',
                      description: 'Максимальна ціна всіх товарів',
                      example: '2000',
                    },
                    absoluteMin: {
                      type: 'number',
                      description: 'Мінімальна ціна всіх товарів',
                      example: '0',
                    },
                  }
                },
                
              },
            },
          ],
        },
      }),
      ApiInternalServerErrorResponse({
        schema: {
          allOf: [
            {
              properties: {
                statusCode: {
                  type: 'number',
                  example: '500',
                },
                message: {
                  type: 'string',
                  description: 'Message',
                  example: 'Internal server error',
                },                
              },
            },
          ],
        },
      }),
    );
  };
