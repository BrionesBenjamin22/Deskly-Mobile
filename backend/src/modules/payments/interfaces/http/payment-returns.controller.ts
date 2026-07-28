import { Controller, Get, Header, Param } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

type PaymentReturnResult = 'success' | 'pending' | 'failure';

const RETURN_CONTENT: Record<
  PaymentReturnResult,
  { title: string; description: string }
> = {
  success: {
    title: 'Pago informado',
    description:
      'Estamos verificando el pago con Mercado Pago. La reserva se confirmará únicamente cuando Deskly reciba el estado aprobado.',
  },
  pending: {
    title: 'Pago en proceso',
    description:
      'Mercado Pago todavía está procesando la operación. Deskly actualizará la reserva cuando exista una confirmación.',
  },
  failure: {
    title: 'Pago no completado',
    description:
      'La operación no fue aprobada. Puede volver a Deskly e intentar nuevamente.',
  },
};

function isPaymentReturnResult(value: string): value is PaymentReturnResult {
  return ['success', 'pending', 'failure'].includes(value);
}

@ApiExcludeController()
@Controller('payments/return')
export class PaymentReturnsController {
  @Get(':result')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header(
    'Content-Security-Policy',
    "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
  )
  @Header('Referrer-Policy', 'no-referrer')
  show(@Param('result') result: string): string {
    const content = isPaymentReturnResult(result)
      ? RETURN_CONTENT[result]
      : RETURN_CONTENT.pending;
    return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${content.title} | Deskly</title>
    <style>
      :root { color-scheme: light; font-family: system-ui, sans-serif; background: #f5f5f7; color: #25252d; }
      body { min-height: 100vh; margin: 0; display: grid; place-items: center; padding: 24px; box-sizing: border-box; }
      main { width: min(100%, 440px); background: #fff; border-radius: 18px; padding: 32px; box-shadow: 0 12px 40px rgba(31, 31, 45, .12); }
      h1 { margin: 0 0 12px; font-size: 1.55rem; }
      p { margin: 0 0 24px; line-height: 1.55; color: #5d5d69; }
      button { width: 100%; border: 0; border-radius: 12px; padding: 14px 18px; background: #38345f; color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
      small { display: block; margin-top: 16px; color: #747482; line-height: 1.45; }
    </style>
  </head>
  <body>
    <main>
      <h1>${content.title}</h1>
      <p>${content.description}</p>
      <button type="button" onclick="window.opener?.focus(); window.close()">Volver a Deskly</button>
      <small>Si esta ventana no se cierra automáticamente, vuelva manualmente a la aplicación.</small>
    </main>
  </body>
</html>`;
  }
}
