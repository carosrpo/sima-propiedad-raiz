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
                <td class="lead-propiedad" title="${propTitulo}">${propTitulo}</td>
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

// ========== Propiedades Admin ==========

function cargarPropiedadesAdmin() {
    let propiedades = obtenerPropiedadesAdmin();
    const filtro = document.getElementById('buscarPropiedad');
    const q = filtro ? filtro.value.toLowerCase() : '';

    if (q) {
        propiedades = propiedades.filter(p =>
            p.titulo.toLowerCase().includes(q) ||
            p.ciudad.toLowerCase().includes(q) ||
            p.departamento.toLowerCase().includes(q)
        );
    }

    const tbody = document.getElementById('tbodyPropiedades');
    const vacio = document.getElementById('propiedadesVacio');
    const tabla = document.querySelector('#tablaPropiedades');
    const leads = obtenerLeads();

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
                <td class="lead-nombre">${prop.titulo}</td>
                <td>${prop.ciudad}, ${prop.departamento}</td>
                <td>${formatearPrecioAdmin(prop.precio)}</td>
                <td>
                    <span style="font-weight:700; color: ${leadsCount > 0 ? 'var(--success)' : 'var(--gray-400)'}">
                        ${leadsCount}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
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
});
