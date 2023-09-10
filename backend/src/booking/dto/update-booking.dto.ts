import { PartialType } from '@nestjs/swagger';
import { ReserveBookingDto } from './reserve-booking.dto';

export class UpdateBookingDto extends PartialType(ReserveBookingDto) {}
