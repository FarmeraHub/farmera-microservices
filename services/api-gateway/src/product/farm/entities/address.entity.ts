import { AddressGHN } from "./address-ghn.entity";

export class Address {
  address_id: number;
  city: string;
  district: string;
  ward: string;
  street: string;
  coordinate: string;
  created: Date;
  address_ghn: AddressGHN;
}