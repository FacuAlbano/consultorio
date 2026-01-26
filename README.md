# Consultorio

Aplicación web para gestión de consultorio médico, construida con React Router v7, TypeScript, Tailwind CSS y Drizzle ORM.

## Características

- 🔐 Autenticación de usuarios
- 📊 Dashboard principal
- 🎨 Interfaz moderna con Tailwind CSS
- 🗄️ Base de datos PostgreSQL con Drizzle ORM
- ⚡ Server-Side Rendering (SSR) con React Router

## Requisitos Previos

- Node.js 18+ 
- PostgreSQL (o una base de datos compatible)
- npm o yarn

## Instalación

1. Clona el repositorio o navega al directorio del proyecto:
```bash
cd consultorio
```

2. Instala las dependencias:
```bash
npm install
```

3. Crea un archivo `.env` en la raíz del proyecto:
```env
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/consultorio
SESSION_SECRET=tu-secret-key-super-segura-aqui
```

4. Configura la base de datos:
```bash
npm run db:push
```

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run typecheck` - Verifica los tipos de TypeScript
- `npm run db:generate` - Genera migraciones de base de datos
- `npm run db:push` - Aplica cambios al esquema de base de datos
- `npm run db:studio` - Abre Drizzle Studio para gestionar la base de datos

## Estructura del Proyecto

```
consultorio/
├── app/
│   ├── components/     # Componentes React
│   │   └── ui/         # Componentes UI reutilizables
│   ├── db/             # Configuración de base de datos
│   │   ├── client.ts   # Cliente de Drizzle
│   │   └── schema.ts   # Esquema de base de datos
│   ├── lib/            # Utilidades y helpers
│   ├── routes/          # Rutas de la aplicación
│   ├── app.css         # Estilos globales
│   ├── root.tsx        # Componente raíz
│   └── routes.ts       # Configuración de rutas
├── public/             # Archivos estáticos
├── drizzle/            # Migraciones de base de datos
└── package.json
```

## Desarrollo

Para iniciar el servidor de desarrollo:

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## Tecnologías Utilizadas

- **React Router v7** - Framework web con SSR
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework de estilos
- **Drizzle ORM** - ORM para PostgreSQL
- **Argon2** - Hashing de contraseñas
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas

## Licencia

Este proyecto es privado.
