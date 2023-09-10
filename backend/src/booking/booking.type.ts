import { convertToTimezone, formatDate } from "@/utils/date";
import { ApiResponseProperty } from "@nestjs/swagger";
import { Booking } from "@prisma/client";

export enum BookingStatus {
    UNCONFIRMED = 0,
    CONFIRMED = 1,
    CANCELLED = 2,
}

export class BookingResponse {

    @ApiResponseProperty()
    identifier: string;

    @ApiResponseProperty()
    email: string;

    @ApiResponseProperty()
    startTime: string;

    @ApiResponseProperty()
    endTime: string;

    @ApiResponseProperty()
    createdAt: string;

    @ApiResponseProperty()
    status: number;

    @ApiResponseProperty()
    statusLabel: string;

    constructor(identifier: string, email: string, startTime: string, endTime: string, createdAt: string, status: number, statusLabel: string) {
        this.identifier = identifier;
        this.email = email;
        this.startTime = startTime;
        this.endTime = endTime;
        this.createdAt = createdAt;
        this.status = status;
        this.statusLabel = statusLabel;
    }

    static fromBooking(booking: Booking): BookingResponse {
        return new BookingResponse(
            booking.identifier,
            booking.email,
            formatDate(convertToTimezone(booking.startTime)),
            formatDate(convertToTimezone(booking.endTime)),
            formatDate(convertToTimezone(booking.createdAt)),
            booking.status,
            BookingStatus[booking.status]
        );
    }
}