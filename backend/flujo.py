from langgraph.graph import StateGraph, END, START
from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, ToolMessage
from langgraph.checkpoint.memory import MemorySaver
from pydantic import BaseModel

from templates import template_design, template_requirement, template_product
from prompts import (
    prompt_product_update, prompt_requirement_node_update, prompt_design_update,
    prompt_product_create, prompt_requirement_create, prompt_design_create,
    prompt_product_reviewer, prompt_requirement_reviewer, prompt_design_reviewer
)
from tools import write_markdown_spec

from typing import TypedDict

class AgentState(TypedDict):
    product: str
    requirement: str 
    design: str
    phase: str
    message: str
    error_message: str
    product_changes: str
    requirement_changes: str
    design_changes: str
    pending_updates: list              # cola de nodos pendientes de propagar
    is_propagation: bool               # indica si el nodo actual recibió un cambio por propagación
    reviewer_feedback: str             # feedback del revisor (vacío = aprobado)
    review_count_product: int          # contador de iteraciones para product
    review_count_requirement: int      # contador de iteraciones para requirement
    review_count_design: int           # contador de iteraciones para design


# Esquemas Pydantic para structured output
class ProductUpdate(BaseModel):
    contenido: str
    cambios: str


class RequirementUpdate(BaseModel):
    contenido: str
    cambios: str


class DesignUpdate(BaseModel):
    contenido: str
    cambios: str


class ReviewResult(BaseModel):
    aprobado: bool
    feedback: str

OPENAI_API_KEY = "sk-..."

# LLMs para creación
llm_product_node = init_chat_model("gpt-4o-mini", model_provider="openai", api_key=OPENAI_API_KEY)
llm_requirement_node = init_chat_model("gpt-4o-mini", model_provider="openai", api_key=OPENAI_API_KEY)
llm_design_node = init_chat_model("gpt-4o-mini", model_provider="openai", api_key=OPENAI_API_KEY)

# LLMs para actualización con structured output
llm_product_update = init_chat_model("gpt-4o-mini", model_provider="openai", api_key=OPENAI_API_KEY).with_structured_output(ProductUpdate)
llm_requirement_update = init_chat_model("gpt-4o-mini", model_provider="openai", api_key=OPENAI_API_KEY).with_structured_output(RequirementUpdate)
llm_design_update = init_chat_model("gpt-4o-mini", model_provider="openai", api_key=OPENAI_API_KEY).with_structured_output(DesignUpdate)

# LLMs para revisores con structured output
llm_product_reviewer = init_chat_model("gpt-4o-mini", model_provider="openai", api_key=OPENAI_API_KEY).with_structured_output(ReviewResult)
llm_requirement_reviewer = init_chat_model("gpt-4o-mini", model_provider="openai", api_key=OPENAI_API_KEY).with_structured_output(ReviewResult)
llm_design_reviewer = init_chat_model("gpt-4o-mini", model_provider="openai", api_key=OPENAI_API_KEY).with_structured_output(ReviewResult)

personalidad_product_node = "Eres un experto de negocio y analisis de producto"
personalidad_requirement_node = "Eres un experto en analisis de requerimientos"
personalidad_design_node = "Eres un arquitecto de software y experto en diseño de software"

# LLMs agentes (con tool calling)
llm_product_agent = llm_product_node.bind_tools([write_markdown_spec])
llm_requirement_agent = llm_requirement_node.bind_tools([write_markdown_spec])
llm_design_agent = llm_design_node.bind_tools([write_markdown_spec])

prompt_tool_usage = (
    "IMPORTANTE: Despues de generar el documento completo, DEBES guardarlo "
    "usando la herramienta 'write_markdown_spec'. Pasa el contenido COMPLETO "
    "del documento como argumento 'content'. El nombre del archivo (file_name) "
    "DEBE ser exactamente el que se te indica en las instrucciones de tu fase."
)


def run_agent_loop(llm, llm_with_tools, messages, tool):
    """Ejecuta el ciclo agente: LLM → tool execution → LLM → ... hasta que no haya tool calls.

    Args:
        llm: LLM base (sin tools, para reintentos sin tool calling forzado)
        llm_with_tools: LLM con tools bindeadas
        messages: Lista de mensajes iniciales
        tool: Herramienta a ejecutar

    Returns:
        str: Contenido generado por el agente
    """
    generated_content = ""
    max_iterations = 5  # safety limit
    iteration = 0

    while iteration < max_iterations:
        iteration += 1
        response = llm_with_tools.invoke(messages)
        messages.append(response)

        if response.content and not generated_content:
            generated_content = response.content

        tool_calls = getattr(response, 'tool_calls', None)
        if not tool_calls:
            if not generated_content:
                generated_content = response.content or ""
            break

        for tc in tool_calls:
            tool_name = tc.get('name', '') if isinstance(tc, dict) else tc.get('name', '')
            tool_args = tc.get('args', {}) if isinstance(tc, dict) else tc.get('args', {})
            tool_id = tc.get('id', '') if isinstance(tc, dict) else tc.get('id', '')

            if tool_name == tool.name:
                try:
                    result = tool.invoke(tool_args)
                except Exception as e:
                    result = f"Error al ejecutar la herramienta '{tool_name}': {e}"
            else:
                result = f"Herramienta desconocida: {tool_name}"

            messages.append(ToolMessage(content=str(result), tool_call_id=tool_id))

    return generated_content


def _guardar_contenido(phase: str, content: str):
    """Guarda el contenido en specs/ usando nombres y extensiones por fase."""
    nombres = {
        "product": "producto",
        "requirement": "requisitos",
        "design": "diseno"
    }
    extensiones = {
        "product": "md",
        "requirement": "md",
        "design": "py"
    }
    name = nombres.get(phase, phase)
    ext = extensiones.get(phase, "md")
    try:
        write_markdown_spec.invoke({"file_name": name, "content": content, "extension": ext})
    except Exception as e:
        print(f"  [save] Error al guardar {name}.{ext}: {e}")


def product_node(state: AgentState):
    print("product node...............")
    
    # Detectar si hay feedback del revisor
    contexto_feedback = ""
    if state.get('reviewer_feedback'):
        # Iteración con feedback del revisor
        mensaje_entrada = state['reviewer_feedback']
        contexto_feedback = f"FEEDBACK DEL REVISOR (Iteración {state.get('review_count_product', 1)}): Debes corregir los siguientes puntos:\n{mensaje_entrada}"
        uso_prompt = prompt_product_create
    else:
        # Primera ejecución o propagación normal
        if state['is_propagation'] and state['requirement_changes'] != '':
            mensaje_entrada = state['requirement_changes']
            uso_prompt = prompt_product_update
        else:
            mensaje_entrada = state['message']
            uso_prompt = prompt_product_create
    
    complete_message = []
    
    if state['product'] == "" or state.get('reviewer_feedback'):
        # Modo agente: primera creacion o retry por feedback del revisor
        complete_message = [
            SystemMessage(content=personalidad_product_node),
            SystemMessage(content=uso_prompt),
            SystemMessage(content=prompt_tool_usage),
            SystemMessage(content="El file_name para write_markdown_spec debe ser exactamente 'producto'."),
        ]
        if contexto_feedback:
            complete_message.append(SystemMessage(content=contexto_feedback))
        if state['product'] != "":
            complete_message.append(SystemMessage(content="Este es el contenido actual que debes corregir:\n" + state['product']))
        complete_message.extend([
            SystemMessage(content="Para hacer el producto debes seguir el siguiente template: \n" + template_product),
            HumanMessage(content=mensaje_entrada)
        ])
        product_content = run_agent_loop(llm_product_node, llm_product_agent, complete_message, write_markdown_spec)
        _guardar_contenido("product", product_content)
        pending = [p for p in state.get('pending_updates', []) if p != 'product']
        return {"product": product_content, "product_changes": "", "pending_updates": pending, "reviewer_feedback": ""}
    else:
        # Modo actualizacion: propagacion o edicion del usuario
        complete_message = [
            SystemMessage(content=personalidad_product_node),
            SystemMessage(content=uso_prompt),
        ]
        complete_message.extend([
            HumanMessage(content=mensaje_entrada),
            SystemMessage(content="Este es el contenido actual del producto: \n" + state['product']),
            SystemMessage(content="Recuerda seguir el siguiente template: \n" + template_product)
        ])
        response = llm_product_update.invoke(complete_message)
        _guardar_contenido("product", response.contenido)
        pending = [p for p in state.get('pending_updates', []) if p != 'product']
        return {"product": response.contenido, "product_changes": response.cambios, "pending_updates": pending, "reviewer_feedback": ""}


def requirement_node(state: AgentState):
    print("requirement node...............")
    
    # Detectar si hay feedback del revisor
    contexto_feedback = ""
    if state.get('reviewer_feedback'):
        # Iteración con feedback del revisor
        mensaje_entrada = state['reviewer_feedback']
        contexto_feedback = f"FEEDBACK DEL REVISOR (Iteración {state.get('review_count_requirement', 1)}): Debes corregir los siguientes puntos:\n{mensaje_entrada}"
        uso_prompt = prompt_requirement_create
    else:
        # Determinar mensaje por propagación o entrada normal
        if state['is_propagation']:
            if state['product_changes'] != '':
                mensaje_entrada = state['product_changes']
            elif state['design_changes'] != '':
                mensaje_entrada = state['design_changes']
            else:
                mensaje_entrada = state['message']
            uso_prompt = prompt_requirement_node_update
        else:
            mensaje_entrada = state['message']
            uso_prompt = prompt_requirement_create
    
    complete_message = []
    if state['requirement'] == "" or state.get('reviewer_feedback'):
        # Modo agente: primera creacion o retry por feedback del revisor
        complete_message = [
            SystemMessage(content=personalidad_requirement_node),
            SystemMessage(content=uso_prompt),
            SystemMessage(content=prompt_tool_usage),
            SystemMessage(content="El file_name para write_markdown_spec debe ser exactamente 'requisitos'."),
        ]
        if contexto_feedback:
            complete_message.append(SystemMessage(content=contexto_feedback))
        if state['requirement'] != "":
            complete_message.append(SystemMessage(content="Este es el contenido actual que debes corregir:\n" + state['requirement']))
        complete_message.extend([
            SystemMessage(content="Debes hacer los requisitos en base a la información propuesta por el producto. El contenido del producto es el siguiente: \n" + state['product']),
            SystemMessage(content="Para hacer los requisitos debes seguir el siguiente template: \n" + template_requirement),
            HumanMessage(content=mensaje_entrada)
        ])
        requirement_content = run_agent_loop(llm_requirement_node, llm_requirement_agent, complete_message, write_markdown_spec)
        _guardar_contenido("requirement", requirement_content)
        pending = [p for p in state.get('pending_updates', []) if p != 'requirement']
        return {"requirement": requirement_content, "requirement_changes": "", "pending_updates": pending, "reviewer_feedback": ""}
    else:
        # Modo actualizacion: propagacion o edicion del usuario
        complete_message = [
            SystemMessage(content=personalidad_requirement_node),
            SystemMessage(content=uso_prompt),
        ]
        complete_message.extend([
            HumanMessage(content=mensaje_entrada),
            SystemMessage(content="Debes hacer los requisitos en base a la información propuesta por el producto. El contenido del producto es el siguiente: \n" + state['product']),
            SystemMessage(content="Este es el contenido actual de los requisitos:\n" + state['requirement']),
            SystemMessage(content="Recuerda seguir el siguiente template: \n" + template_requirement)
        ])
        response = llm_requirement_update.invoke(complete_message)
        _guardar_contenido("requirement", response.contenido)
        pending = [p for p in state.get('pending_updates', []) if p != 'requirement']
        return {"requirement": response.contenido, "requirement_changes": response.cambios, "pending_updates": pending, "reviewer_feedback": ""}


def design_node(state: AgentState):
    print("design node...............")
    
    # Detectar si hay feedback del revisor
    contexto_feedback = ""
    if state.get('reviewer_feedback'):
        # Iteración con feedback del revisor
        mensaje_entrada = state['reviewer_feedback']
        contexto_feedback = f"FEEDBACK DEL REVISOR (Iteración {state.get('review_count_design', 1)}): Debes corregir los siguientes puntos:\n{mensaje_entrada}"
        uso_prompt = prompt_design_create
    else:
        # Determinar mensaje por propagación o entrada normal
        if state['is_propagation'] and state['requirement_changes'] != '':
            mensaje_entrada = state['requirement_changes']
            uso_prompt = prompt_design_update
        else:
            mensaje_entrada = state['message']
            uso_prompt = prompt_design_create
    
    complete_message = []
    
    if state['design'] == "" or state.get('reviewer_feedback'):
        # Modo agente: primera creacion o retry por feedback del revisor
        complete_message = [
            SystemMessage(content=personalidad_design_node),
            SystemMessage(content=uso_prompt),
            SystemMessage(content=prompt_tool_usage),
            SystemMessage(content="El file_name para write_markdown_spec debe ser exactamente 'diseno' y extension 'py'."),
        ]
        if contexto_feedback:
            complete_message.append(SystemMessage(content=contexto_feedback))
        if state['design'] != "":
            complete_message.append(SystemMessage(content="Este es el contenido actual que debes corregir:\n" + state['design']))
        complete_message.extend([
            SystemMessage(content="Debes hacer el diseño en base a la información propuesta por los requisitos. El contenido de los requisitos es el siguiente: \n" + state['requirement']),
            SystemMessage(content="Para hacer el diseño debes seguir el siguiente template: \n" + template_design),
            HumanMessage(content=mensaje_entrada)
        ])
        design_content = run_agent_loop(llm_design_node, llm_design_agent, complete_message, write_markdown_spec)
        _guardar_contenido("design", design_content)
        pending = [p for p in state.get('pending_updates', []) if p != 'design']
        return {"design": design_content, "design_changes": "", "pending_updates": pending, "reviewer_feedback": ""}
    else:
        # Modo actualizacion: propagacion o edicion del usuario
        complete_message = [
            SystemMessage(content=personalidad_design_node),
            SystemMessage(content=uso_prompt),
        ]
        complete_message.extend([
            HumanMessage(content=mensaje_entrada),
            SystemMessage(content="Debes hacer el diseño en base a la información propuesta por los requisitos. El contenido de los requisitos es el siguiente: \n" + state['requirement']),
            SystemMessage(content="Este es el contenido actual del diseño: \n" + state['design']),
            SystemMessage(content="Recuerda seguir el siguiente template: \n" + template_design)
        ])
        response = llm_design_update.invoke(complete_message)
        _guardar_contenido("design", response.contenido)
        pending = [p for p in state.get('pending_updates', []) if p != 'design']
        return {"design": response.contenido, "design_changes": response.cambios, "pending_updates": pending, "reviewer_feedback": ""}


def error_node(state: AgentState):
    mensaje = ''
    if state['phase'] == 'requirement' and state['product'] == '':
        mensaje = "Error: El documento de producto no se ha generado. No se pueden generar los requerimientos sin el producto."
    elif state['phase'] == 'design' and state['requirement'] == '':
        mensaje = "Error: El documento de requerimientos no se ha generado. No se pueden generar el diseño sin los requerimientos."
    else:
        mensaje = "Error: Fase desconocida o estado inconsistente."
    return {"error_message": mensaje}


# =====================================================
# NODOS REVISORES
# =====================================================

def product_reviewer_node(state: AgentState):
    print("product reviewer node.............")
    
    review_count = state.get('review_count_product', 0)
    
    # Si llegó al máximo de intentos, aprobar automáticamente
    if review_count >= 3:
        print(f"  Máximo de iteraciones alcanzado ({review_count}). Aprobando por defecto.")
        return {
            "reviewer_feedback": "",
            "review_count_product": 0
        }
    
    # Revisar el contenido del producto
    prompt_con_mensaje = prompt_product_reviewer.replace("{mensaje_usuario}", state.get('message', ''))
    complete_message = [
        SystemMessage(content=prompt_con_mensaje),
        HumanMessage(content="PRODUCTO A REVISAR:\n" + state['product'])
    ]
    
    resultado = llm_product_reviewer.invoke(complete_message)
    
    if resultado.aprobado:
        print("  ✅ Producto APROBADO")
        return {
            "reviewer_feedback": "",
            "review_count_product": 0
        }
    else:
        print(f"  ❌ Producto RECHAZADO (Iteración {review_count + 1}/3)")
        return {
            "reviewer_feedback": resultado.feedback,
            "review_count_product": review_count + 1
        }


def requirement_reviewer_node(state: AgentState):
    print("requirement reviewer node.............")
    
    review_count = state.get('review_count_requirement', 0)
    
    # Si llegó al máximo de intentos, aprobar automáticamente
    if review_count >= 3:
        print(f"  Máximo de iteraciones alcanzado ({review_count}). Aprobando por defecto.")
        return {
            "reviewer_feedback": "",
            "review_count_requirement": 0
        }
    
    # Revisar el contenido de requisitos
    complete_message = [
        SystemMessage(content=prompt_requirement_reviewer),
        HumanMessage(content="REQUISITOS A REVISAR:\n" + state['requirement'])
    ]
    
    resultado = llm_requirement_reviewer.invoke(complete_message)
    
    if resultado.aprobado:
        print("  ✅ Requisitos APROBADOS")
        return {
            "reviewer_feedback": "",
            "review_count_requirement": 0
        }
    else:
        print(f"  ❌ Requisitos RECHAZADOS (Iteración {review_count + 1}/3)")
        return {
            "reviewer_feedback": resultado.feedback,
            "review_count_requirement": review_count + 1
        }


def design_reviewer_node(state: AgentState):
    print("design reviewer node.............")
    
    review_count = state.get('review_count_design', 0)
    
    # Si llegó al máximo de intentos, aprobar automáticamente
    if review_count >= 3:
        print(f"  Máximo de iteraciones alcanzado ({review_count}). Aprobando por defecto.")
        return {
            "reviewer_feedback": "",
            "review_count_design": 0
        }
    
    # Revisar el contenido del diseño
    complete_message = [
        SystemMessage(content=prompt_design_reviewer),
        HumanMessage(content="DISEÑO A REVISAR:\n" + state['design'])
    ]
    
    resultado = llm_design_reviewer.invoke(complete_message)
    
    if resultado.aprobado:
        print("  ✅ Diseño APROBADO")
        return {
            "reviewer_feedback": "",
            "review_count_design": 0
        }
    else:
        print(f"  ❌ Diseño RECHAZADO (Iteración {review_count + 1}/3)")
        return {
            "reviewer_feedback": resultado.feedback,
            "review_count_design": review_count + 1
        }


def propagador_node(state: AgentState):
    print("propagador node.............")
    
    # si el cambio llegó por propagación, la cadena termina aquí
    if state['is_propagation']:
        return {"pending_updates": [], "is_propagation": False}
    
    origin = state['phase']
    pending = []

    if origin == 'product':
        # Solo propagar si requisitos EXISTE y fue MODIFICACIÓN (product_changes tiene contenido)
        if state['requirement'] != '' and state['product_changes'] != '':
            pending.append('requirement')

    elif origin == 'requirement':
        # Solo propagar si fue MODIFICACIÓN (requirement_changes tiene contenido)
        if state['product'] != '' and state['requirement_changes'] != '':
            pending.append('product')
        if state['design'] != '' and state['requirement_changes'] != '':
            pending.append('design')

    elif origin == 'design':
        # Solo propagar si requisitos EXISTE y fue MODIFICACIÓN (design_changes tiene contenido)
        if state['requirement'] != '' and state['design_changes'] != '':
            pending.append('requirement')

    return {
        "pending_updates": pending,
        "is_propagation": True  # los nodos que reciban esto saben que vienen de propagación
    }




def router(state: AgentState):
    pending = state.get('pending_updates', [])
    
    # primero verifica si hay nodos pendientes de propagar
    if pending:
        next_node = pending[0]
        return next_node
    
    # flujo normal del usuario
    if state['phase'] == 'product':
        return 'product'
    if state['phase'] == 'requirement' and state['product'] == '':
        return "error" 
    elif state['phase'] == 'requirement' and state['product'] != '':
        return 'requirement'
    if state['phase'] == 'design' and state['requirement'] == '':
        return "error" 
    elif state['phase'] == 'design' and state['requirement'] != '':
        return 'design'
    else:
        return "error"


# =====================================================
# ROUTERS PARA REVISORES
# =====================================================

def product_revisor_router(state: AgentState):
    """Decide si el producto vuelve a ser creado o va al propagador"""
    if state.get('reviewer_feedback'):  # Hay feedback = rechazado
        return 'product'  # Retorna al creador
    else:  # Sin feedback = aprobado
        return 'propagador'  # Va al propagador


def requirement_revisor_router(state: AgentState):
    """Decide si los requisitos vuelven a ser creados o van al propagador"""
    if state.get('reviewer_feedback'):  # Hay feedback = rechazado
        return 'requirement'  # Retorna al creador
    else:  # Sin feedback = aprobado
        return 'propagador'  # Va al propagador


def design_revisor_router(state: AgentState):
    """Decide si el diseño vuelve a ser creado o va al propagador"""
    if state.get('reviewer_feedback'):  # Hay feedback = rechazado
        return 'design'  # Retorna al creador
    else:  # Sin feedback = aprobado
        return 'propagador'  # Va al propagador


builder = StateGraph(AgentState)

builder.add_node('product', product_node)
builder.add_node('requirement', requirement_node)
builder.add_node('design', design_node)
builder.add_node('product_reviewer', product_reviewer_node)
builder.add_node('requirement_reviewer', requirement_reviewer_node)
builder.add_node('design_reviewer', design_reviewer_node)
builder.add_node('propagador', propagador_node)  
builder.add_node('error', error_node)

# edges hacia los revisores (no directamente al propagador)
builder.add_edge('product', 'product_reviewer')
builder.add_edge('requirement', 'requirement_reviewer')
builder.add_edge('design', 'design_reviewer')
builder.add_edge('error', END)

# revisores deciden si retornan al creador o van al propagador
builder.add_conditional_edges(
    'product_reviewer',
    product_revisor_router,
    {
        'product': 'product',
        'propagador': 'propagador'
    }
)

builder.add_conditional_edges(
    'requirement_reviewer',
    requirement_revisor_router,
    {
        'requirement': 'requirement',
        'propagador': 'propagador'
    }
)

builder.add_conditional_edges(
    'design_reviewer',
    design_revisor_router,
    {
        'design': 'design',
        'propagador': 'propagador'
    }
)

# el propagador decide si continúa o termina
def propagador_router(state: AgentState):
    pending = state.get('pending_updates', [])
    if pending:
        return pending[0]
    return END

builder.add_conditional_edges(
    'propagador',
    propagador_router,
    {
        'product': 'product',
        'requirement': 'requirement',
        'design': 'design',
        END: END
    }
)

# START usa el router
builder.add_conditional_edges(
    START,
    router,
    {
        'product': 'product',
        'requirement': 'requirement',
        'design': 'design',
        'error': 'error'
    }
)


checkpoint = MemorySaver()
graph = builder.compile(checkpointer=checkpoint)

if __name__ == "__main__":
    config = {"configurable": {"thread_id": "1"}}
    while True:
        print("\n--- FLUJO LANGGRAPH ---")
        print("1. Generar Producto")
        print("2. Generar Requerimientos")
        print("3. Generar Diseño")
        print("4. Nueva sesion (reiniciar todo)")
        print("5. Salir")

        opcion = input("\nSelecciona una opcion (1-5): ").strip()

        if opcion == "5":
            print("Saliendo...")
            break

        if opcion == "4":
            # Reiniciar todo: pasar vacio en los 3 contenidos
            graph.invoke(
                {"product": "", "requirement": "", "design": ""},
                config=config
            )
            print("Estado reiniciado. Puedes empezar de nuevo.")
            continue

        if opcion not in ["1", "2", "3"]:
            print("Opcion invalida. Intenta nuevamente.")
            continue

        fase_map = {"1": "product", "2": "requirement", "3": "design"}
        fase = fase_map[opcion]

        mensaje = input("\nIngresa tu descripcion/entrada: ").strip()

        if not mensaje:
            print("La entrada no puede estar vacia.")
            continue

        estado_guardado = graph.get_state(config)

        if estado_guardado.values:
            # Ya hay estado previo: actualizar (no resetear contenido)
            result = graph.invoke(
                {
                    "phase": fase,
                    "message": mensaje,
                    "error_message": "",
                    "product_changes": "",
                    "requirement_changes": "",
                    "design_changes": "",
                    "pending_updates": [],
                    "is_propagation": False,
                    "reviewer_feedback": "",
                    "review_count_product": 0,
                    "review_count_requirement": 0,
                    "review_count_design": 0,
                },
                config=config
            )
        else:
            # Primera ejecucion: pasar todo vacio
            result = graph.invoke(
                {
                    "phase": fase,
                    "message": mensaje,
                    "error_message": "",
                    "product": "",
                    "requirement": "",
                    "design": "",
                    "product_changes": "",
                    "requirement_changes": "",
                    "design_changes": "",
                    "pending_updates": [],
                    "is_propagation": False,
                    "reviewer_feedback": "",
                    "review_count_product": 0,
                    "review_count_requirement": 0,
                    "review_count_design": 0,
                },
                config=config
            )

        if result.get('error_message'):
            print(f"\n{result['error_message']}")
        else:
            if fase == 'product':
                print(f"\n--- PRODUCTO GENERADO ---\n{result['product']}")
                if result.get('product_changes'):
                    print(f"\n--- CAMBIOS REALIZADOS ---\n{result['product_changes']}")
                # Mostrar mensaje de propagación
                if result.get('requirement_changes'):
                    print(f"\n--- MENSAJE DE PROPAGACIÓN A REQUISITOS ---\n{result['requirement_changes']}")
                    
            elif fase == 'requirement':
                print(f"\n--- REQUERIMIENTOS GENERADOS ---\n{result['requirement']}")
                if result.get('requirement_changes'):
                    print(f"\n--- CAMBIOS REALIZADOS ---\n{result['requirement_changes']}")
                # Mostrar mensajes de propagación
                print("\n--- MENSAJES DE PROPAGACIÓN ---")
                if result.get('product_changes'):
                    print(f"A PRODUCTO:\n{result['product_changes']}\n")
                if result.get('design_changes'):
                    print(f"A DISEÑO:\n{result['design_changes']}")
                    
            elif fase == 'design':
                print(f"\n--- DISEÑO GENERADO ---\n{result['design']}")
                if result.get('design_changes'):
                    print(f"\n--- CAMBIOS REALIZADOS ---\n{result['design_changes']}")
                # Mostrar mensaje de propagación
                if result.get('requirement_changes'):
                    print(f"\n--- MENSAJE DE PROPAGACIÓN A REQUISITOS ---\n{result['requirement_changes']}")