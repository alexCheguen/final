import { NextResponse } from 'next/server';

export function ok(data, message = 'OK') {
  return NextResponse.json({ success: true, message, data }, { status: 200 });
}

export function created(data, message = 'Creado') {
  return NextResponse.json({ success: true, message, data }, { status: 201 });
}

export function error(message, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

export function notFound(message = 'No encontrado') {
  return NextResponse.json({ success: false, message }, { status: 404 });
}

export function unauthorized(message = 'No autorizado') {
  return NextResponse.json({ success: false, message }, { status: 401 });
}

export function conflict(message = 'Conflicto') {
  return NextResponse.json({ success: false, message }, { status: 409 });
}
