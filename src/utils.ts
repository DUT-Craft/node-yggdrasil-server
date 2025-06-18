import * as crypto from "crypto";
import { stringify } from "uuid";

import { UnsignedUUID } from "./types";

export function unsignedUUIDFromBytes(input: crypto.BinaryLike): UnsignedUUID {
    let md5Bytes = crypto.createHash("md5").update(input).digest();
    md5Bytes[6]  &= 0x0f;  /* clear version        */
    md5Bytes[6]  |= 0x30;  /* set to version 3     */
    md5Bytes[8]  &= 0x3f;  /* clear variant        */
    md5Bytes[8]  |= 0x80;  /* set to IETF variant  */
    return stringify(md5Bytes);
}
