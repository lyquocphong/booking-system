import { ApiResponseProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class GetAvailableSlotsDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}

class ServiceResponse {
  @ApiResponseProperty({
    example: 'Body massage'
  })
  name: string;

  @ApiResponseProperty({
    example: 50
  })
  duration: number;

  @ApiResponseProperty({
    example: 100
  })
  price: number;
}

export class BookingSlot {
  @ApiResponseProperty()
  from: string;

  @ApiResponseProperty()
  to: string;

  constructor(from: string, to: string) {
    this.from = from;
    this.to = to;
  }
}

export class GetAvailableSlotsResponse {
  @ApiResponseProperty()
  service: ServiceResponse;

  slots: Record<string, BookingSlot[]>
}
