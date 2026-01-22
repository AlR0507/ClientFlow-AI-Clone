# Configuración de Resend para Envío de Correos a Cualquier Cliente

## Problema
Resend solo permite enviar correos al correo del dueño cuando el dominio no está verificado o hay restricciones en la configuración.

## Solución: Verificar tu Dominio en Resend

Para poder enviar correos a **cualquier cliente** que registres, necesitas verificar tu dominio en Resend. Esto elimina las restricciones y permite enviar a cualquier dirección de correo.

## ⚠️ Importante: ¿Necesitas un Dominio para tu Página Web?

**NO**, no necesitas que tu página web tenga el dominio para verificar en Resend. Puedes usar un dominio diferente o un subdominio solo para correos.

### Opciones Disponibles:

1. **Usar un Dominio Diferente Solo para Correos** (Recomendado)
   - Tu página puede estar en cualquier lugar (Vercel, Netlify, etc.)
   - Puedes comprar un dominio barato solo para correos (ej: `clientflow-ai.com`)
   - Verifica ese dominio en Resend y úsalo solo para enviar correos
   - Ejemplo: `noreply@clientflow-ai.com`

2. **Usar un Subdominio**
   - Si ya tienes un dominio, puedes usar un subdominio solo para correos
   - Ejemplo: `mail.tudominio.com` o `email.tudominio.com`
   - No necesitas tener una página web en ese subdominio
   - **📖 Guía para crear subdominios**: Consulta `GUIA_SUBDOMINIOS.md` para instrucciones paso a paso

3. **Usar el Mismo Dominio de tu Página**
   - Si ya tienes un dominio para tu página web, puedes usarlo también para correos
   - Ejemplo: Si tu página es `tudominio.com`, puedes usar `noreply@tudominio.com`

### Lo que Necesitas:

- **Solo acceso a la configuración DNS del dominio** (donde compraste el dominio)
- **NO necesitas** tener una página web funcionando en ese dominio
- **NO necesitas** que el dominio apunte a ningún servidor

Los registros DNS que agregas en Resend son solo para verificar que eres el dueño del dominio, no requieren que el dominio esté "activo" o tenga una página web.

### Paso 1: Verificar tu Dominio en Resend

1. **Inicia sesión en Resend**
   - Ve a [resend.com](https://resend.com) e inicia sesión
   - Navega a **Domains** en el menú lateral

2. **Agregar un Dominio**
   - Haz clic en **"Add Domain"**
   - Ingresa tu dominio (ej: `tudominio.com` o `mail.tudominio.com`)
   - **Nota**: Puedes usar cualquier dominio que tengas, incluso si no tiene una página web
   - Resend te proporcionará registros DNS que debes agregar

3. **Configurar Registros DNS**
   - Resend te dará varios registros DNS que debes agregar:
     - **SPF Record** (TXT)
     - **DKIM Records** (TXT) - generalmente 3 registros
     - **DMARC Record** (TXT) - opcional pero recomendado
   
   - Ve a tu proveedor de DNS (donde compraste el dominio) y agrega estos registros
   - **📖 Guía detallada**: Consulta `GUIA_DNS.md` para instrucciones paso a paso según tu proveedor (Namecheap, Cloudflare, GoDaddy, etc.)
   - Los registros se ven así:
     ```
     Type: TXT
     Name: @ (o el subdominio que elegiste)
     Value: [el valor que Resend te proporciona]
     ```

4. **Verificar el Dominio**
   - Después de agregar los registros DNS, vuelve a Resend
   - Haz clic en **"Verify Domain"** o espera a que Resend verifique automáticamente
   - La verificación puede tardar desde minutos hasta 24-48 horas (dependiendo de la propagación DNS)

### Paso 2: Actualizar la Edge Function de Supabase

Una vez que tu dominio esté verificado, necesitas actualizar tu Edge Function `send-email` en Supabase para usar tu dominio verificado como remitente.

#### Opción A: Si tienes acceso a la Edge Function

1. Ve a tu proyecto de Supabase
2. Navega a **Edge Functions** > `send-email`
3. Actualiza el código para usar tu dominio verificado:

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: Request) {
  const { to, subject, html, text } = await req.json();

  try {
    const { data, error } = await resend.emails.send({
      from: 'ClientFlow-AI <noreply@tudominio.com>', // Usa tu dominio verificado
      to: to, // Puede ser cualquier correo ahora
      subject: subject,
      html: html,
      text: text,
    });

    if (error) {
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully', data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

#### Opción B: Si no tienes acceso directo a la Edge Function

Si la Edge Function fue creada automáticamente y no tienes acceso directo, puedes:

1. **Crear una nueva Edge Function** en Supabase:
   ```bash
   # Instalar Supabase CLI si no lo tienes
   npm install -g supabase
   
   # Inicializar (si es necesario)
   supabase init
   
   # Crear la función
   supabase functions new send-email
   ```

2. **Código de la función** (`supabase/functions/send-email/index.ts`):
   ```typescript
   import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
   import { Resend } from "https://esm.sh/resend@2.0.0";

   const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
   const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@tudominio.com";

   serve(async (req) => {
     try {
       const { to, subject, html, text } = await req.json();

       if (!RESEND_API_KEY) {
         return new Response(
           JSON.stringify({ success: false, error: "RESEND_API_KEY not configured" }),
           { status: 500, headers: { "Content-Type": "application/json" } }
         );
       }

       const resend = new Resend(RESEND_API_KEY);

       const { data, error } = await resend.emails.send({
         from: FROM_EMAIL,
         to: to, // Ahora puede ser cualquier correo
         subject: subject,
         html: html,
         text: text,
       });

       if (error) {
         return new Response(
           JSON.stringify({ success: false, error: error.message }),
           { status: 400, headers: { "Content-Type": "application/json" } }
         );
       }

       return new Response(
         JSON.stringify({ success: true, message: "Email sent successfully", data }),
         { status: 200, headers: { "Content-Type": "application/json" } }
       );
     } catch (error: any) {
       return new Response(
         JSON.stringify({ success: false, error: error.message }),
         { status: 500, headers: { "Content-Type": "application/json" } }
       );
     }
   });
   ```

3. **Configurar Variables de Entorno en Supabase**:
   - Ve a **Project Settings** > **Edge Functions** > **Secrets**
   - Agrega:
     - `RESEND_API_KEY`: Tu API key de Resend
     - `RESEND_FROM_EMAIL`: `noreply@tudominio.com` (tu dominio verificado)

4. **Desplegar la función**:
   ```bash
   supabase functions deploy send-email
   ```

### Paso 3: Verificar que Funciona

1. Crea una automatización de correo en la aplicación
2. Selecciona un cliente con su correo
3. Ejecuta la automatización
4. Verifica que el correo llegue al cliente

## Alternativa: Usar el Plan de Resend que Permite Envíos a Cualquier Correo

Si no puedes verificar un dominio inmediatamente, Resend tiene un plan que permite enviar a cualquier correo, pero con limitaciones:

- **Plan Free**: Solo puedes enviar a correos verificados
- **Plan Pro**: Permite enviar a cualquier correo después de verificar el dominio

## Notas Importantes

- **Sin dominio verificado**: Solo puedes enviar a correos que hayas verificado manualmente en Resend
- **Con dominio verificado**: Puedes enviar a cualquier correo electrónico
- **Límites de envío**: Resend tiene límites según tu plan (Free: 3,000 emails/mes, Pro: 50,000 emails/mes)

## Solución Rápida Temporal

Si necesitas una solución temporal mientras verificas tu dominio, puedes:

1. Ir a Resend > **API Keys** > **Audiences**
2. Agregar manualmente los correos de tus clientes a una "Audience"
3. Esto te permitirá enviar a esos correos específicos sin verificar el dominio

Sin embargo, **la mejor solución a largo plazo es verificar tu dominio**.

## Ejemplos Prácticos

### Ejemplo 1: Página en Vercel/Netlify, Dominio Diferente para Correos
- **Tu página web**: `clientflow-ai.vercel.app` (o cualquier URL gratuita)
- **Dominio para correos**: `clientflow-ai.com` (compras un dominio barato, ~$10-15/año)
- **Correo desde**: `noreply@clientflow-ai.com`
- **Resultado**: Puedes enviar correos profesionales sin necesidad de tener una página web en ese dominio

### Ejemplo 2: Ya Tienes un Dominio
- **Tu página web**: `mitienda.com`
- **Subdominio para correos**: `mail.mitienda.com` (no necesita página web)
- **Correo desde**: `noreply@mail.mitienda.com`
- **Resultado**: Usas tu dominio existente, solo agregas registros DNS para el subdominio

### Ejemplo 3: Todo en el Mismo Dominio
- **Tu página web**: `mitienda.com`
- **Correo desde**: `noreply@mitienda.com`
- **Resultado**: Todo unificado, solo necesitas agregar los registros DNS que Resend te da

## Preguntas Frecuentes

**P: ¿Puedo usar un dominio que compré pero nunca configuré?**
R: ¡Sí! Solo necesitas acceso a la configuración DNS donde compraste el dominio.

**P: ¿El dominio necesita tener una página web funcionando?**
R: No, solo necesitas poder agregar registros DNS. No requiere que el dominio apunte a ningún servidor.

**P: ¿Puedo usar un dominio gratuito como .tk o .ml?**
R: Técnicamente sí, pero no es recomendado porque muchos proveedores de correo los bloquean. Mejor usar un dominio de pago (.com, .net, etc.).

**P: ¿Cuánto cuesta un dominio?**
R: Depende del TLD (.com ~$10-15/año, otros pueden ser más baratos o caros).
