import { BookingSlot } from "@/booking/dto/get-available-slots.dto";
import { convertToTimezone, formatDate, getDefaultTimezone, getInfoFromTimeString, isValidTimeString } from "@/utils/date";
import { ApiProperty } from "@nestjs/swagger";
import { Booking } from "@prisma/client";
import { Type } from "class-transformer";
import * as moment from "moment";
import { Moment } from "moment";

export class ServiceSchedule {
    @ApiProperty()
    enabled: boolean;

    @ApiProperty()
    from: string;

    @ApiProperty()
    to: string;

    @ApiProperty()
    dateOfWeek: number;

    constructor(dayOfWeek: number, enabled: boolean, from: string, to: string) {
        this.dateOfWeek = dayOfWeek;
        this.enabled = enabled;
        this.from = from;
        this.to = to;
    }

    validate(): boolean {
        if (this.dateOfWeek < 0 || this.dateOfWeek > 6) {
            throw new Error('Invalid day of the week');
        }

        if (!isValidTimeString(this.from) || !isValidTimeString(this.to)) {
            throw new Error('Invalid time string');
        }

        return true;
    }
}

type BookingHasOnlyStartAndEndTime = Pick<Booking, 'startTime' | 'endTime'>;

export class Service {
    @ApiProperty()
    name: string;

    @ApiProperty()
    price: number;

    @ApiProperty()
    duration: number;

    @Type(() => ServiceSchedule)
    schedule: ServiceSchedule[];

    constructor(
        name: string,
        price: number,
        duration: number,
        schedule: ServiceSchedule[]
    ) {
        this.name = name;
        this.price = price;
        this.duration = duration;
        this.schedule = schedule;
    }

    private getTimezoneDateTime(date: Moment, timeString: string): Moment {
        const defaultTimezone = getDefaultTimezone();
        const [hour, minute] = getInfoFromTimeString(timeString);
        return moment(date).tz(defaultTimezone).set({ hour, minute });
    }

    private findAvailableSlots(date: Moment, fromTime: Moment, toTime: Moment, booked: BookingHasOnlyStartAndEndTime[]): BookingSlot[] {
        const dayOfWeek = fromTime.weekday();
        const schedule = this.getSchedule(dayOfWeek);

        if (!schedule || !schedule.enabled) {
            console.log('Service is not enabled');
            return [];
        }

        const scheduleFrom = this.getTimezoneDateTime(date, schedule.from);
        const scheduleTo = this.getTimezoneDateTime(date, schedule.to);

        if (toTime.isAfter(scheduleTo) || fromTime.isBefore(scheduleFrom)) {
            console.log('Out of range');
            return [];
        }

        // Sort booked slots by start time
        const sortedBooked = booked.slice().sort((a, b) => moment(a.startTime).isBefore(moment(b.startTime)) ? -1 : 1);

        const freetime: { start: Moment, end: Moment }[] = [];
        const availableSlots: BookingSlot[] = [];

        let currentTime = scheduleFrom.clone();

        if (sortedBooked.length > 0) {
            for (const booking of sortedBooked) {
                const bookingStart = convertToTimezone(booking.startTime);
                const bookingEnd = convertToTimezone(booking.endTime);

                // Calculate the gap between the current time and the booking start
                const gap = bookingStart.diff(currentTime, 'minutes');

                // There is gap, has avaiable time
                if (gap >= this.duration) {
                    // Add an available slot if the gap is long enough, add from current to start of booking
                    freetime.push({
                        start: currentTime,
                        end: bookingStart
                    })
                }

                // Move the current time to the end of the booking
                currentTime = bookingEnd.clone();
            }
        }

        // Calculate the gap between the last booking end and the day end
        const finalGap = scheduleTo.diff(currentTime, 'minutes');

        if (finalGap >= this.duration) {
            // Add an available slot if the gap is long enough, add from current to start of booking
            freetime.push({
                start: currentTime,
                end: currentTime.clone().add(finalGap, 'minutes')
            })
        }

        freetime.forEach(slot => {
            let start = moment(slot.start).clone();
            let end = null;

            while (start.isBefore(slot.end)) {
                end = start.clone().add(this.duration, 'minutes');

                if (end.isBefore(slot.end)) {
                    availableSlots.push(new BookingSlot(
                        start.clone().format('HH:mm'),
                        end.clone().format('HH:mm'),
                    ));
                }

                start = end.clone();
            }
        })

        return availableSlots;
    }

    getDayAvailableSlots(date: Moment, booked: BookingHasOnlyStartAndEndTime[]): BookingSlot[] {
        const dayOfWeek = date.weekday();
        const schedule = this.getSchedule(dayOfWeek);

        if (!schedule || !schedule.enabled) {
            console.log('dayOfWeek', dayOfWeek, schedule);
            return [];
        }

        const scheduleFrom = this.getTimezoneDateTime(date, schedule.from);
        const scheduleTo = this.getTimezoneDateTime(date, schedule.to);

        return this.findAvailableSlots(date, scheduleFrom, scheduleTo, booked);
    }

    canBook(booking: { startTime: Moment, endTime: Moment }, booked: BookingHasOnlyStartAndEndTime[]): boolean {
        const { startTime, endTime } = booking;
        const defaultTimezone = getDefaultTimezone();
        const date = startTime.clone().tz(defaultTimezone);
        const availableSlots = this.getDayAvailableSlots(date, booked);

        if (booked.length === 0) {
            return true;
        }

        const canFitBooking = availableSlots.some(slot => {
            const [fromHour, fromMinute] = getInfoFromTimeString(slot.from);
            const [toHour, toMinute] = getInfoFromTimeString(slot.to);
            const slotStartTime = moment(date).tz(defaultTimezone).set({ hour: fromHour, minute: fromMinute });
            const slotEndTime = moment(date).tz(defaultTimezone).set({ hour: toHour, minute: toMinute });

            return startTime.isSameOrAfter(slotStartTime) && endTime.isSameOrBefore(slotEndTime);
        });

        return canFitBooking;
    }

    getSchedule(dayOfWeek: number): ServiceSchedule | undefined {
        return this.schedule.find(schedule => schedule.dateOfWeek === dayOfWeek);
    }
}
