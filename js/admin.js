// ========== Configuración ==========

// Credenciales de acceso (en producción esto debe ir en backend)
const ADMIN_CREDENTIALS = {
    usuario: 'admin',
    password: 'SiMa2026*'
};

const SESSION_KEY = 'sima_admin_session';

// ========== Utilidades ==========

function formatearPrecioAdmin(precio) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(precio);
}

function formatearFecha(fecha) {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatearFechaCorta(fecha) {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function esHoy(fecha) {
    const hoy = new Date();
    const d = new Date(fecha);
    return d.toDateString() === hoy.toDateString();
}

// ========== Autenticación ==========

function verificarSesion() {
    const sesion = sessionStorage.getItem(SESSION_KEY);
    if (sesion === 'activa') {
        mostrarDashboard();
    } else {
        mostrarLogin();
    }
}

function iniciarSesion(usuario, password) {
    if (usuario === ADMIN_CREDENTIALS.usuario && password === ADMIN_CREDENTIALS.password) {
        sessionStorage.setItem(SESSION_KEY, 'activa');
        return true;
    }
    return false;
}

function cerrarSesion() {
    sessionStorage.removeItem(SESSION_KEY);
    mostrarLogin();
}

function mostrarLogin() {
    document.getElementById('loginWrapper').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
}

function mostrarDashboard() {
    document.getElementById('loginWrapper').style.display = 'none';
    document.getElementById('dashboard').style.display = 'flex';
    cargarDashboard();
}

// ========== Dashboard ==========

function cargarDashboard() {
    cargarEstadisticas();
    cargarLeads();
    cargarPropiedadesAdmin();
    initSortPropiedades();
    initFiltrosPropiedades();
    initResizeColumnas();
}

function cargarEstadisticas() {
    const leads = obtenerLeads();
    const propiedades = obtenerPropiedadesAdmin();

    const leadsHoy = leads.filter(l => esHoy(l.fecha)).length;
    const propiedadesConLeads = [...new Set(leads.map(l => l.propiedadId))].length;

    document.getElementById('statTotalLeads').textContent = leads.length;
    document.getElementById('statLeadsHoy').textContent = leadsHoy;
    document.getElementById('statPropiedadesConLeads').textContent = propiedadesConLeads;
    document.getElementById('badgeLeads').textContent = leads.length;
    document.getElementById('badgePropiedades').textContent = propiedades.length;
}

// ========== Leads ==========

function obtenerLeads() {
    return JSON.parse(localStorage.getItem('leads') || '[]');
}

function obtenerPropiedadesAdmin() {
    return JSON.parse(localStorage.getItem('propiedades') || '[]');
}

function buscarPropiedad(id) {
    const propiedades = obtenerPropiedadesAdmin();
    return propiedades.find(p => p.id === id);
}

function cargarLeads(filtro = '') {
    let leads = obtenerLeads();

    if (filtro) {
        const q = filtro.toLowerCase();
        leads = leads.filter(l => {
            const prop = buscarPropiedad(l.propiedadId);
            const propTitulo = prop ? prop.titulo.toLowerCase() : '';
            return l.nombre.toLowerCase().includes(q) ||
                   l.telefono.includes(q) ||
                   (l.email && l.email.toLowerCase().includes(q)) ||
                   propTitulo.includes(q);
        });
    }

    const tbody = document.getElementById('tbodyLeads');
    const vacio = document.getElementById('leadsVacio');
    const tabla = document.querySelector('#tablaLeads');

    if (leads.length === 0) {
        tabla.style.display = 'none';
        vacio.style.display = 'block';
        return;
    }

    tabla.style.display = 'table';
    vacio.style.display = 'none';

    tbody.innerHTML = leads.map(lead => {
        const prop = buscarPropiedad(lead.propiedadId);
        const propTitulo = prop ? prop.titulo : 'Propiedad eliminada';

        return `
            <tr>
                <td class="lead-fecha">${formatearFecha(lead.fecha)}</td>
                <td class="lead-nombre">${lead.nombre}</td>
                <td>${lead.telefono}</td>
                <td>${lead.email || '<span style="color:var(--gray-400)">—</span>'}</td>
                <td class="lead-propiedad" title="${propTitulo}">${prop ? `<a href="#" onclick="verDetallePropiedad('${prop.id}'); return false;">${propTitulo}</a>` : 'Propiedad eliminada'}</td>
                <td class="lead-mensaje" title="${lead.mensaje || ''}">${lead.mensaje || '<span style="color:var(--gray-400)">—</span>'}</td>
                <td>
                    <div class="acciones-grupo">
                        <button class="btn-icon" title="Ver detalle" onclick="verDetalleLead('${lead.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon btn-eliminar" title="Eliminar" onclick="eliminarLead('${lead.id}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function verDetalleLead(id) {
    const leads = obtenerLeads();
    const lead = leads.find(l => l.id === id);
    if (!lead) return;

    const prop = buscarPropiedad(lead.propiedadId);
    const propTitulo = prop ? prop.titulo : 'Propiedad eliminada';
    const propPrecio = prop ? formatearPrecioAdmin(prop.precio) : '—';

    const modal = document.getElementById('modalLead');
    const body = document.getElementById('modalLeadBody');

    body.innerHTML = `
        <div class="lead-detalle-body">
            <h3><i class="fas fa-user"></i> Detalle del Lead</h3>
            <div class="lead-campo">
                <div class="lead-campo-label">Nombre</div>
                <div class="lead-campo-valor">${lead.nombre}</div>
            </div>
            <div class="lead-campo">
                <div class="lead-campo-label">Teléfono</div>
                <div class="lead-campo-valor">
                    <a href="https://wa.me/57${lead.telefono}" target="_blank">
                        <i class="fab fa-whatsapp"></i> +57 ${lead.telefono}
                    </a>
                </div>
            </div>
            <div class="lead-campo">
                <div class="lead-campo-label">Correo electrónico</div>
                <div class="lead-campo-valor">
                    ${lead.email ? `<a href="mailto:${lead.email}">${lead.email}</a>` : '<span style="color:var(--gray-400)">No proporcionado</span>'}
                </div>
            </div>
            <div class="lead-campo">
                <div class="lead-campo-label">Propiedad de interés</div>
                <div class="lead-campo-valor">${propTitulo} — ${propPrecio}</div>
            </div>
            <div class="lead-campo">
                <div class="lead-campo-label">Mensaje</div>
                <div class="lead-campo-valor mensaje">
                    ${lead.mensaje || '<span style="color:var(--gray-400)">Sin mensaje</span>'}
                </div>
            </div>
            <div class="lead-campo">
                <div class="lead-campo-label">Fecha de registro</div>
                <div class="lead-campo-valor">${formatearFecha(lead.fecha)}</div>
            </div>
        </div>
    `;

    modal.classList.add('active');
}

function eliminarLead(id) {
    if (!confirm('¿Está seguro de eliminar este lead?')) return;

    let leads = obtenerLeads();
    leads = leads.filter(l => l.id !== id);
    localStorage.setItem('leads', JSON.stringify(leads));

    cargarEstadisticas();
    cargarLeads(document.getElementById('buscarLead').value);
}

// ========== Detalle Propiedad (popup) ==========

function verDetallePropiedad(id) {
    const prop = buscarPropiedad(id);
    if (!prop) return;

    const tipoNombre = NOMBRES_TIPO[prop.tipo] || prop.tipo;
    const icono = ICONOS_TIPO[prop.tipo] || 'fa-building';

    const imagen = prop.imagenes && prop.imagenes.length > 0
        ? `<img src="${prop.imagenes[0]}" alt="${prop.titulo}">`
        : `<div class="placeholder-img"><i class="fas ${icono}"></i></div>`;

    let specs = '';
    if (prop.area) specs += `<div class="spec-item"><i class="fas fa-ruler-combined"></i><div><div class="spec-label">Área</div><div class="spec-value">${prop.area} m²</div></div></div>`;
    if (prop.habitaciones) specs += `<div class="spec-item"><i class="fas fa-bed"></i><div><div class="spec-label">Habitaciones</div><div class="spec-value">${prop.habitaciones}</div></div></div>`;
    if (prop.banos) specs += `<div class="spec-item"><i class="fas fa-bath"></i><div><div class="spec-label">Baños</div><div class="spec-value">${prop.banos}</div></div></div>`;
    if (prop.parqueaderos) specs += `<div class="spec-item"><i class="fas fa-car"></i><div><div class="spec-label">Parqueaderos</div><div class="spec-value">${prop.parqueaderos}</div></div></div>`;
    if (prop.estrato) specs += `<div class="spec-item"><i class="fas fa-layer-group"></i><div><div class="spec-label">Estrato</div><div class="spec-value">${prop.estrato}</div></div></div>`;
    if (prop.antiguedad) specs += `<div class="spec-item"><i class="fas fa-calendar"></i><div><div class="spec-label">Antigüedad</div><div class="spec-value">${prop.antiguedad} años</div></div></div>`;
    if (prop.adminstracion) specs += `<div class="spec-item"><i class="fas fa-file-invoice-dollar"></i><div><div class="spec-label">Administración</div><div class="spec-value">${formatearPrecioAdmin(prop.adminstracion)}/mes</div></div></div>`;

    const modal = document.getElementById('modalPropiedad');
    const body = document.getElementById('modalPropiedadBody');

    body.innerHTML = `
        <div class="detalle-imagen">${imagen}</div>
        <div class="detalle-body">
            <div class="detalle-header">
                <h2>${prop.titulo}</h2>
                <div class="detalle-precio">${formatearPrecioAdmin(prop.precio)}</div>
            </div>
            <p class="detalle-ubicacion">
                <i class="fas fa-map-marker-alt"></i> ${prop.direccion || ''} ${prop.barrio}, ${prop.ciudad}, ${prop.departamento}
            </p>
            <div class="detalle-badges">
                <span class="detalle-badge"><i class="fas ${icono}"></i> ${tipoNombre}</span>
                ${prop.negociable ? '<span class="detalle-badge" style="background:#e8f5e9;color:#2e7d32;"><i class="fas fa-handshake"></i> Precio negociable</span>' : '<span class="detalle-badge"><i class="fas fa-tag"></i> Precio fijo</span>'}
                ${prop.estrato ? `<span class="detalle-badge"><i class="fas fa-layer-group"></i> Estrato ${prop.estrato}</span>` : ''}
                <span class="detalle-badge"><i class="fas fa-calendar-alt"></i> Publicado: ${formatearFechaCorta(prop.fechaPublicacion)}</span>
            </div>
            <p class="detalle-descripcion">${prop.descripcion || '<em>Sin descripción</em>'}</p>
            <div class="detalle-specs">${specs}</div>
            <div class="vendedor-contacto">
                <h4><i class="fas fa-user-tie"></i> Contacto del vendedor</h4>
                <div class="vendedor-datos">
                    <div class="vendedor-campo">
                        <i class="fas fa-user"></i>
                        <span>${prop.contactoNombre || '<em>No registrado</em>'}</span>
                    </div>
                    <div class="vendedor-campo">
                        <i class="fas fa-phone"></i>
                        ${prop.contactoTelefono ? `<a href="https://wa.me/57${prop.contactoTelefono}" target="_blank">+57 ${prop.contactoTelefono}</a>` : '<em>No registrado</em>'}
                    </div>
                    <div class="vendedor-campo">
                        <i class="fas fa-envelope"></i>
                        ${prop.contactoEmail ? `<a href="mailto:${prop.contactoEmail}">${prop.contactoEmail}</a>` : '<em>No registrado</em>'}
                    </div>
                </div>
            </div>
        </div>
    `;

    modal.classList.add('active');
}

// ========== Propiedades Admin ==========

// Estado de sort
let propSort = { col: null, dir: 'asc' };

function cargarPropiedadesAdmin() {
    let propiedades = obtenerPropiedadesAdmin();
    const leads = obtenerLeads();

    // Búsqueda global
    const filtro = document.getElementById('buscarPropiedad');
    const q = filtro ? filtro.value.toLowerCase() : '';
    if (q) {
        propiedades = propiedades.filter(p =>
            p.titulo.toLowerCase().includes(q) ||
            p.ciudad.toLowerCase().includes(q) ||
            p.departamento.toLowerCase().includes(q)
        );
    }

    // Filtros por columna
    const filtroFecha = document.querySelector('[data-filter="fecha"]');
    const filtroTipo = document.querySelector('[data-filter="tipo"]');
    const filtroTitulo = document.querySelector('[data-filter="titulo"]');
    const filtroUbicacion = document.querySelector('[data-filter="ubicacion"]');
    const filtroPrecio = document.querySelector('[data-filter="precio"]');
    const filtroNegociable = document.querySelector('[data-filter="negociable"]');
    const filtroLeads = document.querySelector('[data-filter="leads"]');

    if (filtroFecha && filtroFecha.value) {
        const v = filtroFecha.value.toLowerCase();
        propiedades = propiedades.filter(p => formatearFechaCorta(p.fechaPublicacion).toLowerCase().includes(v));
    }
    if (filtroTipo && filtroTipo.value) {
        propiedades = propiedades.filter(p => p.tipo === filtroTipo.value);
    }
    if (filtroTitulo && filtroTitulo.value) {
        const v = filtroTitulo.value.toLowerCase();
        propiedades = propiedades.filter(p => p.titulo.toLowerCase().includes(v));
    }
    if (filtroUbicacion && filtroUbicacion.value) {
        const v = filtroUbicacion.value.toLowerCase();
        propiedades = propiedades.filter(p => (p.ciudad + ' ' + p.departamento).toLowerCase().includes(v));
    }
    if (filtroPrecio && filtroPrecio.value) {
        const v = Number(filtroPrecio.value.replace(/\D/g, ''));
        if (v) propiedades = propiedades.filter(p => p.precio >= v);
    }
    if (filtroNegociable && filtroNegociable.value) {
        const esNeg = filtroNegociable.value === 'si';
        propiedades = propiedades.filter(p => !!p.negociable === esNeg);
    }
    if (filtroLeads && filtroLeads.value) {
        const v = Number(filtroLeads.value);
        if (!isNaN(v)) propiedades = propiedades.filter(p => leads.filter(l => l.propiedadId === p.id).length >= v);
    }

    // Ordenar
    if (propSort.col) {
        propiedades.sort((a, b) => {
            let va, vb;
            switch (propSort.col) {
                case 'fecha': va = a.fechaPublicacion; vb = b.fechaPublicacion; break;
                case 'tipo': va = a.tipo; vb = b.tipo; break;
                case 'titulo': va = a.titulo.toLowerCase(); vb = b.titulo.toLowerCase(); break;
                case 'ubicacion': va = a.ciudad; vb = b.ciudad; break;
                case 'precio': va = a.precio; vb = b.precio; break;
                case 'negociable': va = a.negociable ? 1 : 0; vb = b.negociable ? 1 : 0; break;
                case 'leads':
                    va = leads.filter(l => l.propiedadId === a.id).length;
                    vb = leads.filter(l => l.propiedadId === b.id).length;
                    break;
                default: return 0;
            }
            if (va < vb) return propSort.dir === 'asc' ? -1 : 1;
            if (va > vb) return propSort.dir === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // Render
    const tbody = document.getElementById('tbodyPropiedades');
    const vacio = document.getElementById('propiedadesVacio');
    const tabla = document.querySelector('#tablaPropiedades');

    if (propiedades.length === 0) {
        tabla.style.display = 'none';
        vacio.style.display = 'block';
        return;
    }

    tabla.style.display = 'table';
    vacio.style.display = 'none';

    const badgeClases = {
        casa: 'badge-casa', apartamento: 'badge-apartamento', lote: 'badge-lote',
        finca: 'badge-finca', local: 'badge-local', oficina: 'badge-oficina', bodega: 'badge-bodega'
    };

    tbody.innerHTML = propiedades.map(prop => {
        const leadsCount = leads.filter(l => l.propiedadId === prop.id).length;
        const tipoNombre = NOMBRES_TIPO[prop.tipo] || prop.tipo;
        const badgeClass = badgeClases[prop.tipo] || '';

        return `
            <tr>
                <td class="lead-fecha">${formatearFechaCorta(prop.fechaPublicacion)}</td>
                <td><span class="tipo-badge ${badgeClass}">${tipoNombre}</span></td>
                <td class="lead-nombre"><a href="#" onclick="verDetallePropiedad('${prop.id}'); return false;">${prop.titulo}</a></td>
                <td>${prop.ciudad}, ${prop.departamento}</td>
                <td>${formatearPrecioAdmin(prop.precio)}</td>
                <td>${prop.negociable ? '<span style="color:var(--success);font-weight:600;">Sí</span>' : '<span style="color:var(--gray-400);">No</span>'}</td>
                <td>
                    <span style="font-weight:700; color: ${leadsCount > 0 ? 'var(--success)' : 'var(--gray-400)'}">
                        ${leadsCount}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

// ========== Sort por columna ==========

function initSortPropiedades() {
    document.querySelectorAll('#tablaPropiedades .th-content').forEach(thContent => {
        thContent.addEventListener('click', () => {
            const th = thContent.closest('th');
            const col = th.dataset.sort;
            if (!col) return;

            // Toggle direction
            if (propSort.col === col) {
                propSort.dir = propSort.dir === 'asc' ? 'desc' : 'asc';
            } else {
                propSort.col = col;
                propSort.dir = 'asc';
            }

            // Update icons
            document.querySelectorAll('#tablaPropiedades th').forEach(t => {
                t.classList.remove('sort-asc', 'sort-desc');
                const icon = t.querySelector('.sort-icon');
                if (icon) { icon.className = 'fas fa-sort sort-icon'; }
            });
            th.classList.add(propSort.dir === 'asc' ? 'sort-asc' : 'sort-desc');
            const icon = th.querySelector('.sort-icon');
            if (icon) { icon.className = `fas fa-sort-${propSort.dir === 'asc' ? 'up' : 'down'} sort-icon`; }

            cargarPropiedadesAdmin();
        });
    });
}

// ========== Filtros por columna ==========

function initFiltrosPropiedades() {
    document.querySelectorAll('#tablaPropiedades .th-filter input, #tablaPropiedades .th-filter select').forEach(el => {
        el.addEventListener('input', () => cargarPropiedadesAdmin());
        el.addEventListener('change', () => cargarPropiedadesAdmin());
        // Prevent sort when clicking in filter
        el.addEventListener('click', (e) => e.stopPropagation());
    });
}

// ========== Resize columnas ==========

function initResizeColumnas() {
    const tabla = document.getElementById('tablaPropiedades');
    if (!tabla) return;

    const handles = tabla.querySelectorAll('.resize-handle');

    handles.forEach(handle => {
        let startX, startWidth, th;

        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            th = handle.closest('th');
            startX = e.pageX;
            startWidth = th.offsetWidth;
            handle.classList.add('active');

            function onMouseMove(e) {
                const newWidth = startWidth + (e.pageX - startX);
                if (newWidth >= 60) {
                    th.style.width = newWidth + 'px';
                }
            }
            function onMouseUp() {
                handle.classList.remove('active');
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            }

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    });
}

// ========== Exportar CSV ==========

function exportarLeadsCSV() {
    const leads = obtenerLeads();
    if (leads.length === 0) {
        alert('No hay leads para exportar');
        return;
    }

    const headers = ['Fecha', 'Nombre', 'Teléfono', 'Email', 'Propiedad', 'Mensaje'];
    const rows = leads.map(lead => {
        const prop = buscarPropiedad(lead.propiedadId);
        return [
            formatearFecha(lead.fecha),
            lead.nombre,
            lead.telefono,
            lead.email || '',
            prop ? prop.titulo : 'Eliminada',
            lead.mensaje || ''
        ].map(v => `"${v.replace(/"/g, '""')}"`).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_sima_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ========== Navegación ==========

function cambiarSeccion(seccion) {
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    document.querySelector(`[data-seccion="${seccion}"]`).classList.add('active');

    document.querySelectorAll('.seccion-contenido').forEach(s => s.style.display = 'none');

    if (seccion === 'leads') {
        document.getElementById('seccionLeads').style.display = 'block';
        document.getElementById('tituloSeccion').textContent = 'Leads - Personas interesadas';
    } else if (seccion === 'propiedades') {
        document.getElementById('seccionPropiedades').style.display = 'block';
        document.getElementById('tituloSeccion').textContent = 'Propiedades publicadas';
        cargarPropiedadesAdmin();
    }
}

// ========== Inicialización ==========

document.addEventListener('DOMContentLoaded', () => {
    verificarSesion();

    // Login
    const formLogin = document.getElementById('formLogin');
    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const usuario = document.getElementById('loginUsuario').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (iniciarSesion(usuario, password)) {
            document.getElementById('loginError').style.display = 'none';
            mostrarDashboard();
        } else {
            document.getElementById('loginError').style.display = 'flex';
        }
    });

    // Toggle password
    document.getElementById('togglePassword').addEventListener('click', () => {
        const input = document.getElementById('loginPassword');
        const icon = document.querySelector('#togglePassword i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    });

    // Logout
    document.getElementById('btnLogout').addEventListener('click', cerrarSesion);

    // Sidebar toggle (mobile)
    document.getElementById('sidebarToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('active');
    });

    // Navegación sidebar
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            cambiarSeccion(link.dataset.seccion);
            document.getElementById('sidebar').classList.remove('active');
        });
    });

    // Búsqueda de leads
    document.getElementById('buscarLead').addEventListener('input', (e) => {
        cargarLeads(e.target.value);
    });

    // Búsqueda de propiedades
    document.getElementById('buscarPropiedad').addEventListener('input', () => {
        cargarPropiedadesAdmin();
    });

    // Exportar CSV
    document.getElementById('btnExportarLeads').addEventListener('click', exportarLeadsCSV);

    // Modal lead
    document.getElementById('cerrarModalLead').addEventListener('click', () => {
        document.getElementById('modalLead').classList.remove('active');
    });
    document.getElementById('modalLead').addEventListener('click', (e) => {
        if (e.target.id === 'modalLead') {
            document.getElementById('modalLead').classList.remove('active');
        }
    });

    // Modal propiedad
    document.getElementById('cerrarModalPropiedad').addEventListener('click', () => {
        document.getElementById('modalPropiedad').classList.remove('active');
    });
    document.getElementById('modalPropiedad').addEventListener('click', (e) => {
        if (e.target.id === 'modalPropiedad') {
            document.getElementById('modalPropiedad').classList.remove('active');
        }
    });
});
