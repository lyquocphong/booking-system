import { formatDate, getDefaultDateFormat, getDefaultTimezone, validateDateRange } from './../utils/date';
import { BadRequestException, Injectable, Body } from '@nestjs/common';
import { ReserveBookingDto } from './dto/reserve-booking.dto';
import { BookingSlot, GetAvailableSlotsResponse } from './dto/get-available-slots.dto';
import { convertToTimezone, getInfoFromTimeString, isTimeInRange } from '@/utils/date';
import { Service } from '@/entities';
import { PrismaService } from '@/prisma.service';
import * as moment from 'moment';
import { Prisma } from '@prisma/client';
import { BookingStatus } from './booking.type';
import { Moment } from 'moment';

@Injectable()
export class BookingService {

  constructor(private readonly prisma: PrismaService) { }

  validateBooking(service: Service, createBookingDto: ReserveBookingDto) {
    const { date, from } = createBookingDto;
    const dayOfWeek = new Date(date).getDay();

    const schedule = service.getSchedule(dayOfWeek);

    if (!schedule) {
      return false;
    }

    const { from: scheduleFrom, to: scheduleTo } = schedule;
    return isTimeInRange(from, scheduleFrom, scheduleTo);
  }

  async confirm(identifier: string) {
    const booking = await this.findOneByIdentifier(identifier, { id: true });

    if (!booking) {
      throw new BadRequestException('booking not found');
    }

    return this.prisma.booking.update({
      where: {
        id: booking.id
      },
      data: {
        status: BookingStatus.CONFIRMED
      }
    })
  }

  async reserve(service: Service, createBookingDto: ReserveBookingDto) {

    if (!this.validateBooking(service, createBookingDto)) {
      throw new BadRequestException('Invalid booking');
    }

    const { date, from, email } = createBookingDto;

    // create start and end time from date and duration from service
    const [fromHour, fromMinute] = getInfoFromTimeString(from);
    
    const defaultTimezone = getDefaultTimezone();

    const currentDate = moment().tz(defaultTimezone).set({ hour: 0, minute: 0 });

    // We need to set hardcode the timezone to default timezone
    const bookingFrom = moment(date).tz(defaultTimezone).set({ hour: fromHour, minute: fromMinute });

    if (bookingFrom.isBefore(currentDate)) {
      throw new BadRequestException('Invalid date');
    }

    const bookingTo = bookingFrom.clone().add(service.duration, 'minutes');

    const booked = await this.findByRange(bookingFrom, bookingTo, { startTime: true, endTime: true }, {
      status: {
        not: BookingStatus.CANCELLED
      }
    })

    const canBook = service.canBook({
      startTime: bookingFrom,
      endTime: bookingTo
    }, booked);

    if (!canBook) {
      throw new BadRequestException('Cannot book this time');
    }

    return await this.prisma.booking.create({
      data: {
        email,
        startTime: bookingFrom.toDate(),
        endTime: bookingTo.toDate(),
        status: BookingStatus.UNCONFIRMED,
        createdAt: new Date()
      }
    })
  }

  async findOneByIdentifier<S extends Prisma.BookingSelect>(identifier: string, select: S) {

    const options = {
      where: {
        identifier
      },
      select
    }

    return await this.prisma.booking.findFirst(options);
  }

  async findByRange<S extends Prisma.BookingSelect>(from: Moment, to: Moment, select: S, condition: Prisma.BookingWhereInput = {}) {
    return await this.prisma.booking.findMany({
      where: {
        startTime: {
          gte: moment(from).startOf('day').utc().toDate(),
          lte: moment(to).endOf('day').utc().toDate()
        },
        ...condition
      },
      select,
      orderBy: [
        {
          startTime: 'asc',
        }
      ],
    });
  }

  async findAll() {
    return await this.prisma.booking.findMany({
      orderBy: [
        {
          startTime: 'asc',
        }
      ],
    });
  }

  async getAvailableSlotForService(service: Service, from: string, to: string): Promise<Record<string, BookingSlot[]>> {

    const defaultTimezone = getDefaultTimezone();

    // Set default timezone
    let fromDate = moment(from).tz(defaultTimezone);
    let toDate = moment(to).tz(defaultTimezone);
    
    if (validateDateRange(from, to) === false) {
      throw new BadRequestException('Invalid date range');
    }

    const condition = {
      status: {
        not: BookingStatus.CANCELLED
      }
    }

    const select = {
      identifier: true,
      status: true,
      email: true,
      startTime: true,
      endTime: true
    }

    let currentDate = fromDate;

    const availableSlots: Record<string, BookingSlot[]> = {};

    while (currentDate.isSameOrBefore(toDate)) {

      let bookedSlots = await this.findByRange(currentDate, currentDate, select, condition);      

      const availableSlotsInDay = service.getDayAvailableSlots(currentDate, bookedSlots.map(booking => ({ startTime: booking.startTime, endTime: booking.endTime })));
      availableSlots[moment(currentDate).format('YYYY-MM-DD')] = availableSlotsInDay;

      currentDate = moment(currentDate).add(1, 'day');
    }

    return availableSlots;
  }
}
