// import { apiLogAppended } from "../../presentation/store/slice";

// import type { AppDispatch } from "@shared/store/hooks";

// export function logApiResponse(
//     dispatch: AppDispatch,
//     endpoint: string,
//     status: number,
//     body: unknown,
// ): void {
//     dispatch(
//         apiLogAppended({
//             level: "INFO",
//             message: `GET ${endpoint}`,
//         }),
//     );

//     dispatch(
//         apiLogAppended({
//             level: "INFO",
//             message: `${status} OK`,
//         }),
//     );

//     dispatch(
//         apiLogAppended({
//             level: "INFO",
//             message: JSON.stringify(body, null, 2),
//         }),
//     );
// }