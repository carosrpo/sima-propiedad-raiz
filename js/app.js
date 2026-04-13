// ========== Utilidades ==========

function formatearPrecio(precio) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(precio);
}

function generarId() {
    return 'prop-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function obtenerPropiedades() {
    let props = JSON.parse(localStorage.getItem('propiedades') || '[]');
    if (props.length === 0) {
        props = PROPIEDADES_EJEMPLO;
        localStorage.setItem('propiedades', JSON.stringify(props));
    }
    return props;
}

function guardarPropiedad(propiedad) {
    const props = obtenerPropiedades();
    props.unshift(propiedad);
    localStorage.setItem('propiedades', JSON.stringify(props));
}

// ========== Página Principal ==========

function initPaginaPrincipal() {
    cargarFiltros();
    cargarPropiedades();
    initEventos();
}

function cargarFiltros() {
    const selectDepartamento = document.getElementById('filtroDepartamento');
    if (!selectDepartamento) return;

    Object.keys(DEPARTAMENTOS_CIUDADES).sort().forEach(dep => {
        const option = document.createElement('option');
        option.value = dep;
        option.textContent = dep;
        selectDepartamento.appendChild(option);
    });

    selectDepartamento.addEventListener('change', () => {
        const selectCiudad = document.getElementById('filtroCiudad');
        selectCiudad.innerHTML = '<option value="">Todas</option>';
        const dep = selectDepartamento.value;
        if (dep && DEPARTAMENTOS_CIUDADES[dep]) {
            DEPARTAMENTOS_CIUDADES[dep].forEach(ciudad => {
                const option = document.createElement('option');
                option.value = ciudad;
                option.textContent = ciudad;
                selectCiudad.appendChild(option);
            });
        }
    });
}

function cargarPropiedades(filtros = {}) {
    let propiedades = obtenerPropiedades();

    // Aplicar filtros
    if (filtros.busqueda) {
        const q = filtros.busqueda.toLowerCase();
        propiedades = propiedades.filter(p =>
            p.titulo.toLowerCase().includes(q) ||
            p.ciudad.toLowerCase().includes(q) ||
            p.barrio.toLowerCase().includes(q) ||
            p.departamento.toLowerCase().includes(q) ||
            (NOMBRES_TIPO[p.tipo] || '').toLowerCase().includes(q)
        );
    }
    if (filtros.tipo) {
        propiedades = propiedades.filter(p => p.tipo === filtros.tipo);
    }
    if (filtros.departamento) {
        propiedades = propiedades.filter(p => p.departamento === filtros.departamento);
    }
    if (filtros.ciudad) {
        propiedades = propiedades.filter(p => p.ciudad === filtros.ciudad);
    }
    if (filtros.precioMin) {
        propiedades = propiedades.filter(p => p.precio >= Number(filtros.precioMin));
    }
    if (filtros.precioMax) {
        propiedades = propiedades.filter(p => p.precio <= Number(filtros.precioMax));
    }
    if (filtros.estrato) {
        propiedades = propiedades.filter(p => p.estrato === Number(filtros.estrato));
    }

    renderizarPropiedades(propiedades);
}

function renderizarPropiedades(propiedades) {
    const grid = document.getElementById('propiedadesGrid');
    const sinResultados = document.getElementById('sinResultados');
    const contador = document.getElementById('contadorResultados');

    if (!grid) return;

    if (propiedades.length === 0) {
        grid.style.display = 'none';
        sinResultados.style.display = 'block';
        contador.textContent = '0 resultados';
        return;
    }

    grid.style.display = 'grid';
    sinResultados.style.display = 'none';
    contador.textContent = `${propiedades.length} resultado${propiedades.length !== 1 ? 's' : ''}`;

    grid.innerHTML = propiedades.map(prop => crearTarjeta(prop)).join('');

    // Eventos click
    grid.querySelectorAll('.propiedad-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            const propiedad = obtenerPropiedades().find(p => p.id === id);
            if (propiedad) abrirDetalle(propiedad);
        });
    });
}

function crearTarjeta(prop) {
    const tipoNombre = NOMBRES_TIPO[prop.tipo] || prop.tipo;
    const icono = ICONOS_TIPO[prop.tipo] || 'fa-building';
    const imagen = prop.imagenes && prop.imagenes.length > 0
        ? `<img src="${prop.imagenes[0]}" alt="${prop.titulo}">`
        : `<div class="placeholder-img"><i class="fas ${icono}"></i></div>`;

    let detalles = '';
    if (prop.tipo !== 'lote') {
        if (prop.area) detalles += `<div class="card-detalle"><i class="fas fa-ruler-combined"></i> ${prop.area} m²</div>`;
        if (prop.habitaciones) detalles += `<div class="card-detalle"><i class="fas fa-bed"></i> ${prop.habitaciones} hab.</div>`;
        if (prop.banos) detalles += `<div class="card-detalle"><i class="fas fa-bath"></i> ${prop.banos} baños</div>`;
        if (prop.parqueaderos) detalles += `<div class="card-detalle"><i class="fas fa-car"></i> ${prop.parqueaderos} parq.</div>`;
    } else {
        if (prop.area) detalles += `<div class="card-detalle"><i class="fas fa-ruler-combined"></i> ${prop.area} m²</div>`;
        if (prop.estrato) detalles += `<div class="card-detalle"><i class="fas fa-layer-group"></i> Estrato ${prop.estrato}</div>`;
    }

    return `
        <div class="propiedad-card" data-id="${prop.id}">
            <div class="card-imagen">
                ${imagen}
                <span class="card-badge badge-${prop.tipo}">${tipoNombre}</span>
                <span class="card-precio">${formatearPrecio(prop.precio)}${prop.negociable ? ' <small style="font-size:0.7rem;opacity:0.85">Negociable</small>' : ''}</span>
            </div>
            <div class="card-body">
                <h3 class="card-titulo">${prop.titulo}</h3>
                <p class="card-ubicacion"><i class="fas fa-map-marker-alt"></i> ${prop.barrio}, ${prop.ciudad} - ${prop.departamento}</p>
                <div class="card-detalles">${detalles}</div>
            </div>
        </div>
    `;
}

function abrirDetalle(prop) {
    const modal = document.getElementById('modalDetalle');
    const body = document.getElementById('modalBody');
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
    if (prop.adminstracion) specs += `<div class="spec-item"><i class="fas fa-file-invoice-dollar"></i><div><div class="spec-label">Administración</div><div class="spec-value">${formatearPrecio(prop.adminstracion)}/mes</div></div></div>`;

    const whatsappMsg = encodeURIComponent(`Hola, estoy interesado en la propiedad: ${prop.titulo} publicada en SiMa Propiedad Raíz. ¿Podría darme más información?`);
    const whatsappLink = `https://wa.me/57${prop.contactoTelefono}?text=${whatsappMsg}`;

    body.innerHTML = `
        <div class="detalle-imagen">${imagen}</div>
        <div class="detalle-body">
            <div class="detalle-header">
                <h2>${prop.titulo}</h2>
                <div class="detalle-precio">${formatearPrecio(prop.precio)}</div>
            </div>
            <p class="detalle-ubicacion">
                <i class="fas fa-map-marker-alt"></i> ${prop.direccion}, ${prop.barrio}, ${prop.ciudad}, ${prop.departamento}
            </p>
            <div class="detalle-badges">
                <span class="detalle-badge"><i class="fas ${icono}"></i> ${tipoNombre}</span>
                ${prop.negociable ? '<span class="detalle-badge" style="background:#e8f5e9;color:#2e7d32;"><i class="fas fa-handshake"></i> Precio negociable</span>' : '<span class="detalle-badge"><i class="fas fa-tag"></i> Precio fijo</span>'}
                ${prop.estrato ? `<span class="detalle-badge"><i class="fas fa-layer-group"></i> Estrato ${prop.estrato}</span>` : ''}
                <span class="detalle-badge"><i class="fas fa-calendar-alt"></i> Publicado: ${new Date(prop.fechaPublicacion).toLocaleDateString('es-CO')}</span>
            </div>
            <p class="detalle-descripcion">${prop.descripcion}</p>
            <div class="detalle-specs">${specs}</div>
            <div class="detalle-contacto">
                <div class="contacto-info">
                    <h4><i class="fas fa-user"></i> ${prop.contactoNombre}</h4>
                    <p><i class="fas fa-phone"></i> +57 ${prop.contactoTelefono}</p>
                    <p><i class="fas fa-envelope"></i> ${prop.contactoEmail}</p>
                </div>
                <a href="${whatsappLink}" target="_blank" class="btn btn-success btn-lg">
                    <i class="fab fa-whatsapp"></i> Contactar por WhatsApp
                </a>
            </div>
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function cerrarModal() {
    const modal = document.getElementById('modalDetalle');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function initEventos() {
    // Menu toggle
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            document.querySelector('.nav').classList.toggle('active');
        });
    }

    // Buscar
    const btnBuscar = document.getElementById('btnBuscar');
    const searchInput = document.getElementById('searchInput');
    if (btnBuscar) {
        btnBuscar.addEventListener('click', () => {
            cargarPropiedades({ busqueda: searchInput.value });
        });
    }
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') cargarPropiedades({ busqueda: searchInput.value });
        });
    }

    // Filtrar
    const btnFiltrar = document.getElementById('btnFiltrar');
    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', () => {
            const filtros = {
                tipo: document.getElementById('filtroTipo').value,
                departamento: document.getElementById('filtroDepartamento').value,
                precioMin: document.getElementById('filtroPrecioMin').value,
                precioMax: document.getElementById('filtroPrecioMax').value,
                busqueda: searchInput ? searchInput.value : ''
            };
            cargarPropiedades(filtros);
        });
    }

    // Limpiar filtros
    const btnLimpiar = document.getElementById('btnLimpiar');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', () => {
            document.getElementById('filtroTipo').value = '';
            document.getElementById('filtroDepartamento').value = '';
            document.getElementById('filtroPrecioMin').value = '';
            document.getElementById('filtroPrecioMax').value = '';
            if (searchInput) searchInput.value = '';
            cargarPropiedades();
        });
    }

    // Modal
    const modalClose = document.getElementById('modalClose');
    if (modalClose) {
        modalClose.addEventListener('click', cerrarModal);
    }
    const modal = document.getElementById('modalDetalle');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) cerrarModal();
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarModal();
    });

    // Footer links
    document.querySelectorAll('[data-filtro-tipo]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('filtroTipo').value = link.dataset.filtroTipo;
            document.getElementById('btnFiltrar').click();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    document.querySelectorAll('[data-filtro-ciudad]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = link.dataset.filtroCiudad;
                cargarPropiedades({ busqueda: link.dataset.filtroCiudad });
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// ========== Página Publicar ==========

function initPaginaPublicar() {
    cargarSelectsDepartamento();
    initFormulario();
    initEventosPublicar();
}

function cargarSelectsDepartamento() {
    const selectDep = document.getElementById('departamento');
    if (!selectDep) return;

    Object.keys(DEPARTAMENTOS_CIUDADES).sort().forEach(dep => {
        const option = document.createElement('option');
        option.value = dep;
        option.textContent = dep;
        selectDep.appendChild(option);
    });

    selectDep.addEventListener('change', () => {
        const selectCiudad = document.getElementById('ciudad');
        selectCiudad.innerHTML = '<option value="">Seleccionar...</option>';
        const dep = selectDep.value;
        if (dep && DEPARTAMENTOS_CIUDADES[dep]) {
            DEPARTAMENTOS_CIUDADES[dep].forEach(ciudad => {
                const option = document.createElement('option');
                option.value = ciudad;
                option.textContent = ciudad;
                selectCiudad.appendChild(option);
            });
        }
    });
}

function initFormulario() {
    const form = document.getElementById('formPublicar');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!validarFormulario()) return;

        const imagenes = [];
        const previews = document.querySelectorAll('.preview-img img');
        previews.forEach(img => imagenes.push(img.src));

        const propiedad = {
            id: generarId(),
            tipo: document.getElementById('tipoPropiedad').value,
            titulo: document.getElementById('titulo').value.trim(),
            descripcion: document.getElementById('descripcion').value.trim(),
            precio: Number(document.getElementById('precio').value),
            departamento: document.getElementById('departamento').value,
            ciudad: document.getElementById('ciudad').value,
            barrio: document.getElementById('barrio').value.trim(),
            direccion: document.getElementById('direccion').value.trim(),
            area: Number(document.getElementById('area').value) || 0,
            habitaciones: Number(document.getElementById('habitaciones').value) || 0,
            banos: Number(document.getElementById('banos').value) || 0,
            parqueaderos: Number(document.getElementById('parqueaderos').value) || 0,
            estrato: Number(document.getElementById('estrato').value) || 0,
            antiguedad: Number(document.getElementById('antiguedad').value) || 0,
            adminstracion: Number(document.getElementById('administracion').value) || 0,
            negociable: document.getElementById('negociable').checked,
            contactoNombre: '',
            contactoTelefono: '',
            contactoEmail: '',
            imagenes: imagenes,
            fechaPublicacion: new Date().toISOString().split('T')[0]
        };

        guardarPropiedad(propiedad);

        // Mostrar éxito
        document.getElementById('formPublicar').style.display = 'none';
        document.getElementById('mensajeExito').style.display = 'block';
    });
}

function validarFormulario() {
    let valido = true;
    const campos = [
        { id: 'tipoPropiedad', msg: 'Seleccione un tipo de propiedad' },
        { id: 'titulo', msg: 'Ingrese un título' },
        { id: 'precio', msg: 'Ingrese el precio' },
        { id: 'departamento', msg: 'Seleccione un departamento' },
        { id: 'ciudad', msg: 'Seleccione una ciudad' },
        { id: 'barrio', msg: 'Ingrese el barrio' },
        { id: 'area', msg: 'Ingrese el área' },
    ];

    // Limpiar errores previos
    document.querySelectorAll('.form-grupo').forEach(g => g.classList.remove('error'));

    campos.forEach(campo => {
        const el = document.getElementById(campo.id);
        if (!el || !el.value.trim()) {
            const grupo = el.closest('.form-grupo');
            if (grupo) {
                grupo.classList.add('error');
                const errorMsg = grupo.querySelector('.error-msg');
                if (errorMsg) errorMsg.textContent = campo.msg;
            }
            valido = false;
        }
    });

    if (!valido) {
        const primerError = document.querySelector('.form-grupo.error');
        if (primerError) primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return valido;
}

function initEventosPublicar() {
    // Menu toggle
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            document.querySelector('.nav').classList.toggle('active');
        });
    }

    // Upload de imágenes
    const uploadArea = document.getElementById('uploadArea');
    const inputImagenes = document.getElementById('inputImagenes');
    const previewContainer = document.getElementById('previewImagenes');

    if (inputImagenes) {
        inputImagenes.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                if (!file.type.startsWith('image/')) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const div = document.createElement('div');
                    div.className = 'preview-img';
                    div.innerHTML = `
                        <img src="${ev.target.result}" alt="Preview">
                        <button type="button" onclick="this.parentElement.remove()">&times;</button>
                    `;
                    previewContainer.appendChild(div);
                };
                reader.readAsDataURL(file);
            });
        });
    }

    // Toggle negociable
    const toggleNegociable = document.getElementById('negociable');
    const toggleEstado = document.getElementById('toggleEstado');
    if (toggleNegociable && toggleEstado) {
        toggleNegociable.addEventListener('change', () => {
            toggleEstado.textContent = toggleNegociable.checked ? 'Sí' : 'No';
            toggleEstado.classList.toggle('activo', toggleNegociable.checked);
        });
    }

    // Formato de precio en tiempo real
    const precioInput = document.getElementById('precio');
    if (precioInput) {
        precioInput.addEventListener('input', () => {
            const hint = precioInput.parentElement.querySelector('.input-hint');
            if (hint && precioInput.value) {
                hint.textContent = formatearPrecio(Number(precioInput.value));
            }
        });
    }
}

// ========== Inicialización ==========

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('propiedadesGrid')) {
        initPaginaPrincipal();
    }
    if (document.getElementById('formPublicar')) {
        initPaginaPublicar();
    }
});
