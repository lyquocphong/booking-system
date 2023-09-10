import { IsTimeStringFormatConstraint } from "@/validators/time-string";
import { ApiProperty, ApiResponseProperty } from "@nestjs/swagger";
import { IsDateString, IsEmail, IsNotEmpty, IsString, Validate } from "class-validator";
import * as moment from "moment";

export class ReserveBookingDto {

    @IsDateString()
    @ApiProperty({ required: true, default: moment().format('YYYY-MM-DD') })
    date: string

    @IsString({ message: 'Start time must be a string' })
    @IsNotEmpty({ message: 'Start time is required' })
    @Validate(IsTimeStringFormatConstraint, {
        message: 'Start time must be in "HH:mm" format (e.g., "09:00")',

    })
    @ApiProperty({ required: true, default: '09:00' })
    from: string    

    @IsEmail()
    @ApiProperty({ required: true, default: 'abc@example.com' })
    email: string
}
