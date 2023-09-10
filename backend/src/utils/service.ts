import { Service, ServiceSchedule } from "@/entities";
import { Booking } from "@prisma/client";
import * as moment from 'moment';

/**
 * Get default service
 *
 * @return {Service} 
 */
export const getDefaultService = (): Service => {
    return new Service(
        'body-message',
        100,
        50,
        [
            new ServiceSchedule(0, true, '09:00', '17:00'),
            new ServiceSchedule(1, true, '09:00', '17:00'),
            new ServiceSchedule(6, true, '09:00', '17:00'),
        ]
    );
}