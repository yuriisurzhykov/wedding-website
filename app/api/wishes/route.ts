import {NextResponse} from "next/server";

import {submitWish} from "@features/wish-submit";

export async function POST(request: Request) {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            {error: "invalid_json", message: "Request body must be valid JSON"},
            {status: 400},
        );
    }

    const result = await submitWish(body);

    if (result.ok) {
        return NextResponse.json({ok: true}, {status: 200});
    }

    if (result.kind === "validation") {
        return NextResponse.json(
            {
                error: "validation",
                fieldErrors: result.fieldErrors,
                formErrors: result.formErrors,
            },
            {status: 400},
        );
    }

    if (result.kind === "config") {
        console.error("[api/wishes] config", result.message);
        return NextResponse.json({error: "server_error"}, {status: 500});
    }

    console.error("[api/wishes] database", result.message);
    return NextResponse.json({error: "server_error"}, {status: 500});
}
