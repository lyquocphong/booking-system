import { Controller, Get, Post, Body, Patch, Param, Delete, Query, BadRequestException } from '@nestjs/common';
import { BookingService } from './booking.service';
import { ApiBadRequestResponse, ApiOkResponse, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetAvailableSlotsDto, GetAvailableSlotsResponse } from './dto/get-available-slots.dto';
import * as moment from 'moment-timezone';
import { convertToTimezone, formatDate, validateDateRange } from '@/utils/date';
import { ReserveBookingDto } from './dto/reserve-booking.dto';
import { getDefaultService } from '@/utils/service';
import { BookingResponse, BookingStatus } from './booking.type';

@Controller('booking')
@ApiTags('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) { }

  @Get()
  async findAll() {
    const bookings = await this.bookingService.findAll();

    return bookings.map(booking => ({
      ...booking,
      startTime: formatDate(convertToTimezone(booking.startTime)),
      endTime: formatDate(convertToTimezone(booking.endTime))
    }));
  }

  @Post('reserve')
  async reserve(@Body() createBookingDto: ReserveBookingDto): Promise<BookingResponse> {
    const service = getDefaultService();
    const booking = await this.bookingService.reserve(service, createBookingDto);
    return BookingResponse.fromBooking(booking);
  }

  @Get('available-slots')
  @ApiQuery({
    name: 'from',
    required: true,
    type: String,
    description: 'From date string. It should be valid date string in format YYYY-MM-DD',
    example: moment().utc().format('YYYY-MM-DD'),
  })
  @ApiQuery({
    name: 'to',
    required: true,
    type: String,
    description: 'To date string. It should be valid date string in format YYYY-MM-DD',
    example: moment().utc().format('YYYY-MM-DD'),
  })
  @ApiOkResponse({
    description: 'Available slots',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  price: { type: 'number' },
                  duration: { type: 'number' },
                },
              },
              slots: {
                type: 'object',
                additionalProperties: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      from: { type: 'string' },
                      to: { type: 'string' },
                    }
                  }
                },
              },
            },
          },
        },
      },
    }
  })
  async getAvailableSlots(
    @Query() getAvailableSlotsDto: GetAvailableSlotsDto,
  ): Promise<GetAvailableSlotsResponse> {
    const { from, to } = getAvailableSlotsDto;

    const service = getDefaultService();
    const availableSlots = await this.bookingService.getAvailableSlotForService(
      service,
      from,
      to
    );

    return {
      service: {
        name: service.name,
        price: service.price,
        duration: service.duration
      },
      slots: availableSlots
    }
  }
}
