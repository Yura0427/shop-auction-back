import { LoggerTargetsFilter, LoggerTergetAdminFilter } from './targetEnum';

export const responseClientDataFilter = (res: any, target: string) => {
  if (LoggerTargetsFilter[target] === target) {
    if (res.data) {
      return res.data.map((e: { id: string | number }) => {
        return { id: e.id };
      });
    }
  }
  return res;
};

export const responseAdminDataFilter = (res: any, target: string) => {
  if (LoggerTergetAdminFilter[target] === target) {
    if (target === LoggerTergetAdminFilter.findTrees) {
      return Object.entries(res)[0][1];
    }
    if (res.data) {
      return res.data.map((e: { id: string | number }) => {
        return { id: e.id };
      });
    }
  }
  return res;
};
