export interface LoginDetails {
  systemId: string;
  userName: string;
  password: string;
  mainDiskSerialNumber: string;
}

export interface SuccessfullLoginInfo {
  authorizedUserId: number;
  user: BasicUserUnion;
  authorizationLevel: AuthorizationLevel;
  token: string;
}

export interface BasicUser {
  type: string;
  personalData: PersonalDataUnion;
}

export interface PersonalData {
  id: number;
  firstName: string;
  lastName: string;
  passport: string;
  tel: string;
  pel: string;
  email: string;
  city: string;
  smsPermited: boolean;
  emailPermited: boolean;
  address: string;
  zipCode: string;
  picture: any;
  neighborhoodId: number;
  groupId: number;
  gender: number;
  relationId: number;
  birthDayDate: Calendar;
  accountType: UserAccountTypes;
  createdBy: number;
  createdOn: Calendar;
  type: string;
}

export interface Calendar {
  year: number;
  month: number;
  day: number;
}

export type BasicUserUnion = BasicUser;
export type PersonalDataUnion = PersonalData;

export enum UserAccountTypes {
  PARENT_ACCOUNT = 0,
  USER_ACCOUNT = 1,
  MANAGER = 2,
  TUTOR = 3,
  SECRATERY = 4,
  LEAD = 5,
  GENERAL_WORKER = 6,
  SUPPLIER = 7,
}

export enum AuthorizationLevel {
  UNAUTHORIZED = 0,
  CUSTOMER = 1,
  VIEWER = 2,
  TUTOR = 3,
  SECRATERY = 4,
  MANAGER = 5,
  ADMIN = 6,
}
