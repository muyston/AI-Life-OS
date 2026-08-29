import { NextResponse } from "next/server";
import { ZodError } from "zod";

export interface ApiResponseSuccess<T> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface ApiResponseError {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

export const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

/**
 * Genera una respuesta JSON estandarizada de éxito con encabezados no-cache por defecto
 */
export function apiSuccess<T>(
  data: T,
  options?: {
    status?: number;
    message?: string;
    meta?: Record<string, unknown>;
    headers?: HeadersInit;
  }
) {
  const payload: ApiResponseSuccess<T> = {
    success: true,
    data,
    ...(options?.message ? { message: options.message } : {}),
    ...(options?.meta ? { meta: options.meta } : {}),
  };

  return NextResponse.json(payload, {
    status: options?.status || 200,
    headers: {
      ...NO_CACHE_HEADERS,
      ...(options?.headers || {}),
    },
  });
}

/**
 * Genera una respuesta JSON estandarizada de error
 */
export function apiError(
  message: string,
  options?: {
    status?: number;
    code?: string;
    details?: unknown;
    headers?: HeadersInit;
  }
) {
  const payload: ApiResponseError = {
    success: false,
    error: message,
    ...(options?.code ? { code: options.code } : {}),
    ...(options?.details ? { details: options.details } : {}),
  };

  return NextResponse.json(payload, {
    status: options?.status || 500,
    headers: {
      ...NO_CACHE_HEADERS,
      ...(options?.headers || {}),
    },
  });
}

/**
 * Manejador centralizado de errores para rutas API (incluye ZodError)
 */
export function handleApiError(error: unknown, fallbackMessage = "Error interno del servidor") {
  if (error instanceof ZodError) {
    const formattedErrors = error.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));

    return apiError("Los datos suministrados no son válidos.", {
      status: 400,
      code: "VALIDATION_ERROR",
      details: formattedErrors,
    });
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error("Excepción en ruta API:", error);

  return apiError(errorMessage || fallbackMessage, {
    status: 500,
    code: "INTERNAL_SERVER_ERROR",
  });
}
