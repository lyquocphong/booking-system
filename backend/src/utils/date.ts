import { BadRequestException } from "@nestjs/common";
import * as moment from 'moment';
import { Moment } from "moment-timezone";

export const validateDateRange = (fromDateStr: string, toDateStr: string): boolean => {

    let fromDate = moment(fromDateStr);
    let toDate = moment(toDateStr);

    if (fromDate.isAfter(toDate) || toDate.isBefore(fromDate)) {
        return false;
    }

    return true;
}

export const isTimeInRange = (timeToCheck: string, scheduleFrom: string, scheduleTo: string): boolean => {

    if (!isValidTimeString(timeToCheck) || !isValidTimeString(scheduleFrom) || !isValidTimeString(scheduleTo)) {
        const message = `Invalid time string: timeToCheck: ${timeToCheck}, scheduleFrom: ${scheduleFrom}, scheduleTo: ${scheduleTo}`;
        throw new BadRequestException(message);
    }

    const [hoursToCheck, minutesToCheck] = getInfoFromTimeString(timeToCheck);
    const [startHours, startMinutes] = getInfoFromTimeString(scheduleFrom);
    const [endHours, endMinutes] = getInfoFromTimeString(scheduleTo);

    const startTimeInMinutes = startHours * 60 + startMinutes;
    const endTimeInMinutes = endHours * 60 + endMinutes;
    const timeToCheckInMinutes = hoursToCheck * 60 + minutesToCheck;

    return timeToCheckInMinutes >= startTimeInMinutes && timeToCheckInMinutes <= endTimeInMinutes;
}

export const isValidTimeString = (value: string): boolean => {
    return moment(value, 'HH:mm', true).isValid();
}

/**
 * Get info from time string
 *
 * @param {string} value 
 *   The string want to get info. Example: 09:00
 *
 * @return {[number, number]}
 *   Return the info. Example: [9, 0] The first one is hour and second is minute
 */
export const getInfoFromTimeString = (value: string): [number, number] => {
    if (!isValidTimeString(value)) {
        const message = `Invalid time string: value: ${value}`;
        throw new BadRequestException(message);
    }
    return value.split(':').map(val => parseInt(val, 10)) as [number, number];
}

export const getDefaultTimezone = (): string => {
    return process.env.DEFAULT_TIMEZONE || 'Europe/Helsinki';
}

export const getDefaultDateFormat = (): string => {
    return process.env.DEFAULT_TIMEFORMAT || 'YYYY-MM-DD HH:mm';
}

export const convertToTimezone = (value: Date, timezone?: string): Moment => {
    timezone = timezone ?? getDefaultTimezone();
    return moment(value).utc().tz(timezone, false);
}

export const formatDate = (moment: Moment, format?: string): string => {

    format = format ?? getDefaultDateFormat();

    return moment.format(format);
}

export const getDefaultTimeSlotFormat = (): string => {
    return ''
}