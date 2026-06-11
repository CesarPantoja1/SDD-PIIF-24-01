template_product = """
# {{NOMBRE DEL PRODUCTO}}

## Resumen Ejecutivo
[Descripción de qué es, para quién y qué problema resuelve. 2-3 frases.]

## Problema
[Qué situación actual justifica construir este producto.]

## Público Objetivo
- **[Segmento]**: [rol, necesidad principal, contexto de uso]

## Propuesta de Valor
[Qué hace único a este producto. Por qué elegir esto sobre alternativas.]

## Capacidades Clave
1. **[Capacidad 1]**: [descripción concisa, diferenciadora]
2. **[Capacidad 2]**: [descripción concisa, diferenciadora]

## Casos de Uso Principales
- Cuando [situación], el [usuario] puede [acción] para [beneficio].

## Alcance

### Dentro del Alcance
- [Qué SÍ cubre este producto]
- [Funcionalidades incluidas]

### Fuera del Alcance
- [Qué NO cubre este producto]
- [Funcionalidades excluidas o postergadas]

### Supuestos y Dependencias
- [Supuestos sobre los que se basa el producto]
- [Dependencias externas necesarias]

## Métricas de Éxito
- [Métrica 1 cuantificable y realista]
- [Métrica 2 cuantificable y realista]

## Restricciones
- [Limitaciones de negocio, técnicas, legales, presupuesto]

"""









template_requirement = """
# Documento de Requisitos

## Introduccion
[Descripcion breve de la funcionalidad y para quien. 2-3 lineas.]

## Contexto de Alcance
- **Dentro del alcance**: [comportamientos cubiertos]
- **Fuera del alcance**: [comportamientos excluidos]

## Requisitos

### Requisito 1: [Nombre del area de requisito]
**Objetivo:** Como [ROL], quiero [CAPACIDAD], para [BENEFICIO]

#### Criterios de Aceptacion
1. When [evento], el sistema shall [respuesta]
2. If [condicion], then el sistema shall [respuesta]
3. While [precondicion], el sistema shall [respuesta]
4. Where [funcionalidad incluida], el sistema shall [respuesta]
... (los criterios que sean necesarios)

### Requisito 2: [Nombre del area de requisito]
**Objetivo:** Como [ROL], quiero [CAPACIDAD], para [BENEFICIO]

#### Criterios de Aceptacion
1. When [evento], el sistema shall [respuesta]
2. If [condicion], then el sistema shall [respuesta]
... (los criterios que sean necesarios)

"""


template_design = """
# ============================================
# ENUMERACIONES
# ============================================
NombreEnum = Enumeration(name="NombreEnum", literals={
    EnumerationLiteral(name="VALOR1"),
    EnumerationLiteral(name="VALOR2")
})

# ============================================
# CLASES
# ============================================
NombreClase = Class(name="NombreClase")

# ============================================
# ATRIBUTOS
# ============================================
NombreClase_atributo = Property(name="atributo", type=StringType)
NombreClase_atributo2 = Property(name="atributo2", type=IntegerType)
NombreClase.attributes = {NombreClase_atributo, NombreClase_atributo2}

# ============================================
# METODOS
# ============================================
NombreClase_metodo = Method(
    name="nombreMetodo",
    parameters={Parameter(name="param", type=StringType)},
    type=BooleanType
)
NombreClase.methods = {NombreClase_metodo}

# ============================================
# RELACIONES (BinaryAssociation)
# ============================================
nombre_rel = BinaryAssociation(name="nombre_rel", ends={
    Property(name="origen", type=ClaseOrigen, multiplicity=Multiplicity(1, 1)),
    Property(name="destino", type=ClaseDestino, multiplicity=Multiplicity(0, "*"), is_composite=True)
})

# ============================================
# HERENCIA (Generalization)
# ============================================
gen_nombre = Generalization(general=ClasePadre, specific=ClaseHija)

# ============================================
# DOMAIN MODEL
# ============================================
domain_model = DomainModel(
    name="NombreDelSistema",
    types={Clase1, Clase2, Enum1},
    associations={rel1, rel2},
    generalizations={gen1}
)
"""