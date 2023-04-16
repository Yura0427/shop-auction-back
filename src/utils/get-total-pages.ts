import { NotFoundException } from '@nestjs/common';

export const getTotalPages = (
  count: number,
  limit: number,
  page: number,
): number => {
  // #initial page must have 0 value
  const totalPages = Math.ceil(count / limit);

  if (page > totalPages && count) {
    throw new NotFoundException();
  }
  return totalPages;
};

export const takeSkipCalculator = (itemPerPage: number, pageIndex: number) => {
  const take = itemPerPage;
  let skip = 0;

  if (pageIndex > 1) {
    skip = (pageIndex - 1) * take;
  }

  return { take, skip };
};
