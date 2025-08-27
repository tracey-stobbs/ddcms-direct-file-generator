import { DateTime } from 'luxon';
import { DateFormatter } from '../lib/utils/dateFormatter';
import type { JsonValue } from '../mcp/router';

export async function pickOptions(): Promise<JsonValue> {
    // Provide available options for EaziPay generation/preview
    const dateFormats = DateFormatter.getAvailableFormats();
    // Trailer formats are defined in documentation/types as 'quoted'|'unquoted'
    const trailerFormats = ['quoted', 'unquoted'];
    // Provide examples for each date format using today's date
    const examples = DateFormatter.getFormatExamples(DateTime.now());
    return ({ options: { dateFormats, trailerFormats, examples } } as unknown) as JsonValue;
}
