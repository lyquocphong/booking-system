import { isValidTimeString } from "@/utils/date";
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from "class-validator";
import * as moment from 'moment-timezone';

@ValidatorConstraint({ name: 'timeString', async: false })
export class IsTimeStringFormatConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (typeof value !== 'string') {
      return false;
    }

    return isValidTimeString(value);
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be in 'HH:mm' format (e.g., '09:00')`;
  }
}