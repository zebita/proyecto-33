/**
* matter-js 0.12.0 by @liabru 2017-02-02
* http://brm.io/matter-js/
* Licencia MIT
*/

/**
 * La Licencia MIT (MIT)
 * 
 * Derechos de autor (c) 2014 por Liam Brummitt
 * 
 * Por la presente se otorga permiso, sin cargo, a cualquier persona que obtenga una copia 
 * de este software, y los archivos de documentación asociados (el "Software"), para utilizar
 * el Software sin restricciones, incluidos, entre otros, los derechos
 * para usar, copiar, modificar, fusionar, publicar, distribuir, sublicenciar y / o vender
 * copias del Software, y para permitir a las personas a las que se destina el Software
 * adaptado para ello, sujeto a las siguientes condiciones:
 *
 * El aviso de derechos de auto anterior y este aviso de permiso se incluirán en
 * todas las copias o partes sustanciales del Software.
 * 
 * EL SOFTWARE SE PROPORCIONA "TAL CUAL", SIN GARANTÍA DE NINGÚN TIPO, EXPRESA O
 * IMPLÍCITA, INCLUYENDO PERO NO LIMITADO A LAS GARANTÍAS DE COMERCIABILIDAD,
 * APTITUD PARA UN PROPÓSITO PARTICULAR Y NO INFRACCIÓN. EN NINGÚN CASO
 * LOS AUTORES O TITULARES DE LOS DERECHOS DE AUTOR SERÁN RESPONSABLES DE CUALQUIER RECLAMO, DAÑOS U OTRAS
 * RESPONSABILIDADES, YA SEA EN UNA ACCIÓN DE CONTRATO, AGRAVIO O DE OTRO MODO, QUE SURJA DE,
 * FUERA O EN RELACIÓN CON EL SOFTWARE O EL USO U OTROS ASUNTOS EN
 * EL SOFTWARE.
 */

(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Matter = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
/**
* El módulo`Matter.Body` contiene métodos para crear y manipular modelos corporales.
* Un cuerpo `Matter.Body` es un cuerpo rígido que puede ser simulado por un `Matter.Engine`.
* El almacén para configuraciones corporales de uso común (como rectángulos, círculos y otros polígonos), se pueden encontrar en el módulo `Matter.Bodies`.
*
* Ver cómo se utiliza [ejemplos](https://github.com/liabru/matter-js/tree/master/examples).

* @class Body - @clase Cuerpo
*/

var Body = {};

module.exports = Body;

var Vertices = _dereq_('../geometry/Vertices');
var Vector = _dereq_('../geometry/Vector');
var Sleeping = _dereq_('../core/Sleeping');
var Render = _dereq_('../render/Render');
var Common = _dereq_('../core/Common');
var Bounds = _dereq_('../geometry/Bounds');
var Axes = _dereq_('../geometry/Axes');

(function() {

    Body._inertiaScale = 4;
    Body._nextCollidingGroupId = 1;
    Body._nextNonCollidingGroupId = -1;
    Body._nextCategory = 0x0001;

    /**
     * Crea un nuevo modelo de cuerpo rígido. El parámetro de opciones es un objeto que especifica las propiedades que desees para anular los valores predeterminados.
     * Todas las propiedades tienen valores predeterminados y muchas se precalculan automáticamente en función de otras propiedades.
     * Los vértices deben especificarse en el orden de las manecillas del reloj.
     * Consulte la sección de propiedades a continuación para obtener información detallada sobre lo que puede pasar a través del objeto `options`.
     * @method create - crear
     * @param {} options  - opciones
     * @return {body} body - cuerpo
     */
    Body.create = function(options) {
        var defaults = {
            id: Common.nextId(),
            type: 'body',
            label: 'Body',
            parts: [],
            plugin: {},
            angle: 0,
            vertices: Vertices.fromPath('L 0 0 L 40 0 L 40 40 L 0 40'),
            position: { x: 0, y: 0 },
            force: { x: 0, y: 0 },
            torque: 0,
            positionImpulse: { x: 0, y: 0 },
            constraintImpulse: { x: 0, y: 0, angle: 0 },
            totalContacts: 0,
            speed: 0,
            angularSpeed: 0,
            velocity: { x: 0, y: 0 },
            angularVelocity: 0,
            isSensor: false,
            isStatic: false,
            isSleeping: false,
            motion: 0,
            sleepThreshold: 60,
            density: 0.001,
            restitution: 0,
            friction: 0.1,
            frictionStatic: 0.5,
            frictionAir: 0.01,
            collisionFilter: {
                category: 0x0001,
                mask: 0xFFFFFFFF,
                group: 0
            },
            slop: 0.05,
            timeScale: 1,
            render: {
                visible: true,
                opacity: 1,
                sprite: {
                    xScale: 1,
                    yScale: 1,
                    xOffset: 0,
                    yOffset: 0
                },
                lineWidth: 0
            }
        };

        var body = Common.extend(defaults, options);

        _initProperties(body, options);

        return body;
    };

    /**
     * Devuelve el siguiente índice de grupo único para el que colisionarán los cuerpos.
     * Si `isNonColliding` es` true`, devuelve el siguiente índice de grupo único para el que los cuerpos _no_ colisionarán.
     * Consulte `body.collisionFilter` para obtener más información.
     * @method nextGroup
     * @param {bool} [isNonColliding=false]
     * @return {Number} Índice de grupo único
     */
    Body.nextGroup = function(isNonColliding) {
        if (isNonColliding)
            return Body._nextNonCollidingGroupId--;

        return Body._nextCollidingGroupId++;
    };

    /**
     * Regresa el siguiente campo de bits de categoría única (comenzando después de la categoría inicial predeterminada `0x0001`).
     * Hay 32 disponibles. Consulta `body.collisionFilter` para obtener más información.
     * @method nextCategory
     * @return {Number} Campo de bits de categoría única
     */
    Body.nextCategory = function() {
        Body._nextCategory = Body._nextCategory << 1;
        return Body._nextCategory;
    };

    /**
     * Inicializa las propiedades corporales.
     * @method _initProperties
     * @private
     * @param {body} body - cuerpo
     * @param {} [options]
     */
    var _initProperties = function(body, options) {
        options = options || {};

        // propiedades requeridas por init (el orden es importante)
        Body.set(body, {
            bounds: body.bounds || Bounds.create(body.vertices),
            positionPrev: body.positionPrev || Vector.clone(body.position),
            anglePrev: body.anglePrev || body.angle,
            vertices: body.vertices,
            parts: body.parts || [body],
            isStatic: body.isStatic,
            isSleeping: body.isSleeping,
            parent: body.parent || body
        });

        Vertices.rotate(body.vertices, body.angle, body.position);
        Axes.rotate(body.axes, body.angle);
        Bounds.update(body.bounds, body.vertices, body.velocity);

        // permite que las opciones anulen las propiedades calculadas automáticamente
        Body.set(body, {
            axes: options.axes || body.axes,
            area: options.area || body.area,
            mass: options.mass || body.mass,
            inertia: options.inertia || body.inertia
        });

        // renderiza las propiedades
        var defaultFillStyle = (body.isStatic ? '#2e2b44' : Common.choose(['#006BA6', '#0496FF', '#FFBC42', '#D81159', '#8F2D56'])),
            defaultStrokeStyle = Common.shadeColor(defaultFillStyle, -20);
        body.render.fillStyle = body.render.fillStyle || defaultFillStyle;
        body.render.strokeStyle = body.render.strokeStyle || defaultStrokeStyle;
        body.render.sprite.xOffset += -(body.bounds.min.x - body.position.x) / (body.bounds.max.x - body.bounds.min.x);
        body.render.sprite.yOffset += -(body.bounds.min.y - body.position.y) / (body.bounds.max.y - body.bounds.min.y);
    };

    /**
     * Dada una propiedad y un valor (o mapa de), establece la(s) propiedad (s) en el cuerpo, usando las funciones de establecimiento apropiadas si existen.
     * Preferentement utiliza las funciones reales de la incubadora en situaciones críticas de rendimiento.
     * @method set - establecer
     * @param {body} body - cuerpo
     * @param {} settings Un nombre de propiedad (o mapa de propiedades y valores) para establecer en el cuerpo.
     * @param {} value El valor para establecer si `settings` es un solo nombre de propiedad.
     */
    Body.set = function(body, settings, value) {
        var property;

        if (typeof settings === 'string') {
            property = settings;
            settings = {};
            settings[property] = value;
        }

        for (property in settings) {
            value = settings[property];

            if (!settings.hasOwnProperty(property))
                continue;

            switch (property) {

            case 'isStatic':
                Body.setStatic(body, value);
                break;
            case 'isSleeping':
                Sleeping.set(body, value);
                break;
            case 'mass':
                Body.setMass(body, value);
                break;
            case 'density':
                Body.setDensity(body, value);
                break;
            case 'inertia':
                Body.setInertia(body, value);
                break;
            case 'vertices':
                Body.setVertices(body, value);
                break;
            case 'position':
                Body.setPosition(body, value);
                break;
            case 'angle':
                Body.setAngle(body, value);
                break;
            case 'velocity':
                Body.setVelocity(body, value);
                break;
            case 'angularVelocity':
                Body.setAngularVelocity(body, value);
                break;
            case 'parts':
                Body.setParts(body, value);
                break;
            default:
                body[property] = value;

            }
        }
    };

    /**
     * Establece el cuerpo como estático, incluido el indicador isStatic y establece la masa y la inercia en Infinito.
     * @method setStatic
     * @param {body} body - cuerpo
     * @param {bool} isStatic
     */
    Body.setStatic = function(body, isStatic) {
        for (var i = 0; i < body.parts.length; i++) {
            var part = body.parts[i];
            part.isStatic = isStatic;

            if (isStatic) {
                part._original = {
                    restitution: part.restitution,
                    friction: part.friction,
                    mass: part.mass,
                    inertia: part.inertia,
                    density: part.density,
                    inverseMass: part.inverseMass,
                    inverseInertia: part.inverseInertia
                };

                part.restitution = 0;
                part.friction = 1;
                part.mass = part.inertia = part.density = Infinity;
                part.inverseMass = part.inverseInertia = 0;

                part.positionPrev.x = part.position.x;
                part.positionPrev.y = part.position.y;
                part.anglePrev = part.angle;
                part.angularVelocity = 0;
                part.speed = 0;
                part.angularSpeed = 0;
                part.motion = 0;
            } else if (part._original) {
                part.restitution = part._original.restitution;
                part.friction = part._original.friction;
                part.mass = part._original.mass;
                part.inertia = part._original.inertia;
                part.density = part._original.density;
                part.inverseMass = part._original.inverseMass;
                part.inverseInertia = part._original.inverseInertia;

                delete part._original;
            }
        }
    };

    /**
     * Establece la masa del cuerpo. La masa y la densidad inversas se actualizan automáticamente para reflejar el cambio.
     * @method setMass
     * @param {body} body - cuerpo
     * @param {number} mass - masa
     */
    Body.setMass = function(body, mass) {
        body.mass = mass;
        body.inverseMass = 1 / body.mass;
        body.density = body.mass / body.area;
    };

    /**
     * Establece la densidad del cuerpo. La masa se actualiza automáticamente para reflejar el cambio.
     * @method setDensity
     * @param {body} body - cuerpo
     * @param {number} density - densidad
     */
    Body.setDensity = function(body, density) {
        Body.setMass(body, density * body.area);
        body.density = density;
    };

    /**
     * Establece el momento de inercia (es decir, segundo momento de área) del cuerpo.
     * La inercia inversa se actualiza automáticamente para reflejar el cambio. La masa no se cambia.
     * @method setInertia
     * @param {body} body - cuerpo
     * @param {number} inertia - innercia 
     */
    Body.setInertia = function(body, inertia) {
        body.inertia = inertia;
        body.inverseInertia = 1 / body.inertia;
    };

    /**
     * Establece los vértices del cuerpo y actualiza las propiedades del cuerpo en consecuencia, incluida la inercia, el área y la masa (con respecto a `body.density`).
     * Los vértices se transformarán automáticamente para orientarse alrededor de su centro de masa como origen.
     * A continuación, se traducen automáticamente al espacio mundial en función de "body.position".
     *
     * El argumento `vértices` debe pasarse como una formación de puntos` Matter.Vector` puntos (o una formación `Matter.Vertices`).
     * Los vértices deben formar un casco convexo, los cascos cóncavos no son compatibles.
     *
     * @method setVertices
     * @param {body} body - cuerpo
     * @param {vector[]} vertices - vértices
     */
    Body.setVertices = function(body, vertices) {
        // change vertices
        if (vertices[0].body === body) {
            body.vertices = vertices;
        } else {
            body.vertices = Vertices.create(vertices, body);
        }

        // actualizar propiedades
        body.axes = Axes.fromVertices(body.vertices);
        body.area = Vertices.area(body.vertices);
        Body.setMass(body, body.density * body.area);

        // orientar los vértices alrededor del centro de masa en el origen (0, 0)
        var centre = Vertices.centre(body.vertices);
        Vertices.translate(body.vertices, centre, -1);

        // actualizar la inercia mientras los vértices están en el origen (0, 0)
        Body.setInertia(body, Body._inertiaScale * Vertices.inertia(body.vertices, body.mass));

        // actualizar geometría
        Vertices.translate(body.vertices, body.position);
        Bounds.update(body.bounds, body.vertices, body.velocity);
    };

    /**
     * Establece las partes del `body` y actualiza la masa, la inercia y el centroide.
     * Cada parte tendrá su padre establecido en `body`.
     * De forma predeterminada, el casco convexo se calculará automáticamente y se establecerá en `body`, a menos que` autoHull` se establezca en `false`.
     * Ten en cuenta que este método garantizará que la primera parte de `body.parts` sea siempre el ` body`.
     * @method setParts
     * @param {body} body - cuerpo
     * @param [body] parts - partes
     * @param {bool} [autoHull=true]
     */
    Body.setParts = function(body, parts, autoHull) {
        var i;

        // agregue todas las partes, asegurándose de que la primera parte sea siempre el cuerpo padre.
        parts = parts.slice(0);
        body.parts.length = 0;
        body.parts.push(body);
        body.parent = body;

        for (i = 0; i < parts.length; i++) {
            var part = parts[i];
            if (part !== body) {
                part.parent = body;
                body.parts.push(part);
            }
        }

        if (body.parts.length === 1)
            return;

        autoHull = typeof autoHull !== 'undefined' ? autoHull : true;

        // encontrar el envolvente convexa de todas las partes para colocar en el cuerpo principal
        if (autoHull) {
            var vertices = [];
            for (i = 0; i < parts.length; i++) {
                vertices = vertices.concat(parts[i].vertices);
            }

            Vertices.clockwiseSort(vertices);

            var hull = Vertices.hull(vertices),
                hullCentre = Vertices.centre(hull);

            Body.setVertices(body, hull);
            Vertices.translate(body.vertices, hullCentre);
        }

        // sumar las propiedades de todas las partes compuestas del cuerpo padre
        var total = _totalProperties(body);

        body.area = total.area;
        body.parent = body;
        body.position.x = total.centre.x;
        body.position.y = total.centre.y;
        body.positionPrev.x = total.centre.x;
        body.positionPrev.y = total.centre.y;

        Body.setMass(body, total.mass);
        Body.setInertia(body, total.inertia);
        Body.setPosition(body, total.centre);
    };

    /**
     * Establece la posición del cuerpo al instante. La velocidad, el ángulo, la fuerza, etc. no se modifican.
     * @method setPosition
     * @param {body} body - cuerpo
     * @param {vector} position - posición
     */
    Body.setPosition = function(body, position) {
        var delta = Vector.sub(position, body.position);
        body.positionPrev.x += delta.x;
        body.positionPrev.y += delta.y;

        for (var i = 0; i < body.parts.length; i++) {
            var part = body.parts[i];
            part.position.x += delta.x;
            part.position.y += delta.y;
            Vertices.translate(part.vertices, delta);
            Bounds.update(part.bounds, part.vertices, body.velocity);
        }
    };

    /**
     * Establece el ángulo del cuerpo al instante. La velocidad angular, la posición, la fuerza, etc. no se modifican.
     * @method setAngle
     * @param {body} body - cuerpo
     * @param {number} angle - ángulo
     */
    Body.setAngle = function(body, angle) {
        var delta = angle - body.angle;
        body.anglePrev += delta;

        for (var i = 0; i < body.parts.length; i++) {
            var part = body.parts[i];
            part.angle += delta;
            Vertices.rotate(part.vertices, delta, body.position);
            Axes.rotate(part.axes, delta);
            Bounds.update(part.bounds, part.vertices, body.velocity);
            if (i > 0) {
                Vector.rotateAbout(part.position, delta, body.position, part.position);
            }
        }
    };

    /**
     * Establece la velocidad lineal del cuerpo al instante. La posición, el ángulo, la fuerza, etc. no se modifican. Consulta también `Body.applyForce`.
     * @method setVelocity
     * @param {body} body - cuerpo
     * @param {vector} velocity - velocidad
     */
    Body.setVelocity = function(body, velocity) {
        body.positionPrev.x = body.position.x - velocity.x;
        body.positionPrev.y = body.position.y - velocity.y;
        body.velocity.x = velocity.x;
        body.velocity.y = velocity.y;
        body.speed = Vector.magnitude(body.velocity);
    };

    /**
     * Establece la velocidad angular del cuerpo al instante. La posición, el ángulo, la fuerza, etc. no se modifican. Consulte también `Body.applyForce`.
     * @method setAngularVelocity
     * @param {body} body - cuerpo
     * @param {number} velocity - velocidad
     */
    Body.setAngularVelocity = function(body, velocity) {
        body.anglePrev = body.angle - velocity;
        body.angularVelocity = velocity;
        body.angularSpeed = Math.abs(body.angularVelocity);
    };

    /**
     * Mueve un cuerpo por un vector dado en relación con su posición actual, sin impartir alguna velocidad.
     * @method translate
     * @param {body} body - cuerpo
     * @param {vector} translation - traducción
     */
    Body.translate = function(body, translation) {
        Body.setPosition(body, Vector.add(body.position, translation));
    };

    /**
     * Gira un cuerpo en un ángulo dado en relación con su ángulo actual, sin impartir alguna velocidad angular.
     * @method rotate
     * @param {body} body
     * @param {number} rotation
     */
    Body.rotate = function(body, rotation) {
        Body.setAngle(body, body.angle + rotation);
    };

    /**
     * Escala el cuerpo, incluida la actualización de las propiedades físicas (masa, área, ejes, inercia), desde un punto del espacio del mundo (el valor predeterminado es el centro del cuerpo).
     * @method scale
     * @param {body} body - cuerpo
     * @param {number} scaleX - escala en X
     * @param {number} scaleY - escala en Y
     * @param {vector} [point]
     */
    Body.scale = function(body, scaleX, scaleY, point) {
        for (var i = 0; i < body.parts.length; i++) {
            var part = body.parts[i];

            // escalar vértices
            Vertices.scale(part.vertices, scaleX, scaleY, body.position);

            // actualizar propiedades
            part.axes = Axes.fromVertices(part.vertices);

            if (!body.isStatic) {
                part.area = Vertices.area(part.vertices);
                Body.setMass(part, body.density * part.area);

                // actualizar la inercia (requiere que los vértices estén en el origen)
                Vertices.translate(part.vertices, { x: -part.position.x, y: -part.position.y });
                Body.setInertia(part, Vertices.inertia(part.vertices, part.mass));
                Vertices.translate(part.vertices, { x: part.position.x, y: part.position.y });
            }

            // actualizar límites
            Bounds.update(part.bounds, part.vertices, body.velocity);
        }

        // manipular circulos 
        if (body.circleRadius) { 
            if (scaleX === scaleY) {
                body.circleRadius *= scaleX;
            } else {
                // el cuerpo ya no es un círculo
                body.circleRadius = null;
            }
        }

        if (!body.isStatic) {
            var total = _totalProperties(body);
            body.area = total.area;
            Body.setMass(body, total.mass);
            Body.setInertia(body, total.inertia);
        }
    };

    /**
     * Realiza un paso de simulación para el `body` dado, incluida la actualización de la posición y el ángulo mediante la integración de Verlet.
     * @method update
     * @param {body} body - cuerpo
     * @param {number} deltaTime 
     * @param {number} timeScale 
     * @param {number} correction - correción 
     */
    Body.update = function(body, deltaTime, timeScale, correction) {
        var deltaTimeSquared = Math.pow(deltaTime * timeScale * body.timeScale, 2);

        // del paso anterior
        var frictionAir = 1 - body.frictionAir * timeScale * body.timeScale,
            velocityPrevX = body.position.x - body.positionPrev.x,
            velocityPrevY = body.position.y - body.positionPrev.y;

        // actualizar la velocidad con la integración de Verlet
        body.velocity.x = (velocityPrevX * frictionAir * correction) + (body.force.x / body.mass) * deltaTimeSquared;
        body.velocity.y = (velocityPrevY * frictionAir * correction) + (body.force.y / body.mass) * deltaTimeSquared;

        body.positionPrev.x = body.position.x;
        body.positionPrev.y = body.position.y;
        body.position.x += body.velocity.x;
        body.position.y += body.velocity.y;

        // actualizar la velocidad angular con la integración de Verlet
        body.angularVelocity = ((body.angle - body.anglePrev) * frictionAir * correction) + (body.torque / body.inertia) * deltaTimeSquared;
        body.anglePrev = body.angle;
        body.angle += body.angularVelocity;

        // registro de velocidad y aceleración
        body.speed = Vector.magnitude(body.velocity);
        body.angularSpeed = Math.abs(body.angularVelocity);

        // transformar la geometría del cuerpo
        for (var i = 0; i < body.parts.length; i++) {
            var part = body.parts[i];

            Vertices.translate(part.vertices, body.velocity);
            
            if (i > 0) {
                part.position.x += body.velocity.x;
                part.position.y += body.velocity.y;
            }

            if (body.angularVelocity !== 0) {
                Vertices.rotate(part.vertices, body.angularVelocity, body.position);
                Axes.rotate(part.axes, body.angularVelocity);
                if (i > 0) {
                    Vector.rotateAbout(part.position, body.angularVelocity, body.position, part.position);
                }
            }

            Bounds.update(part.bounds, part.vertices, body.velocity);
        }
    };

    /**
     * Aplica una fuerza a un cuerpo desde una determinada posición en el espacio del mundo, incluido el torque resultante.
     * @method applyForce 
     * @param {body} body - cuerpo
     * @param {vector} position - posición
     * @param {vector} force - fuerza
     */
    Body.applyForce = function(body, position, force) {
        body.force.x += force.x;
        body.force.y += force.y;
        var offset = { x: position.x - body.position.x, y: position.y - body.position.y };
        body.torque += offset.x * force.y - offset.y * force.x;
    };

    /**
     * Devuelve las sumas de las propiedades de todas las partes compuestas del cuerpo padre.
     * @method _totalProperties
     * @private
     * @param {body} body - cuerpo
     * @return {}
     */
    var _totalProperties = function(body) {
        // https://ecourses.ou.edu/cgi-bin/ebook.cgi?doc=&topic=st&chap_sec=07.2&page=theory
        // http://output.to/sideway/default.asp?qno=121100087

        var properties = {
            mass: 0,
            area: 0,
            inertia: 0,
            centre: { x: 0, y: 0 }
        };

        // sumar las propiedades de todas las partes compuestas del cuerpo padre
        for (var i = body.parts.length === 1 ? 0 : 1; i < body.parts.length; i++) {
            var part = body.parts[i];
            properties.mass += part.mass;
            properties.area += part.area;
            properties.inertia += part.inertia;
            properties.centre = Vector.add(properties.centre, 
                                           Vector.mult(part.position, part.mass !== Infinity ? part.mass : 1));
        }

        properties.centre = Vector.div(properties.centre, 
                                       properties.mass !== Infinity ? properties.mass : body.parts.length);

        return properties;
    };

    /*
    *
    *  Documentación de Eventos
    *
    */

    /**
    * Se dispara cuando un cuerpo comienza a dormir (donde `this` es el cuerpo).
    *
    * @event sleepStart
    * @this {body} The body that has started sleeping - El cuerpo que ha comenzado a dormir 
    * @param {} event An event object - Un objeto de evento
    * @param {} event.source The source object of the event - El objeto fuente del evento
    * @param {} event.name The name of the event - El nombre del evento
    */

    /**
    * Se dispara cuando un cuerpo termina durmiendo (donde `this` es el cuerpo).
    *
    * @event sleepEnd
    * @this {body} The body that has ended sleeping - El cuerpo que ha terminado durmiendo
    * @param {} event An event object - Un objeto de evento
    * @param {} event.source The source object of the event - El objeto fuente del evento
    * @param {} event.name The name of the event - El nombre del evento
    */

    /*
    *
    *  Documentación de Propiedades
    *
    */

    /**
     * Un número entero de identificación única generado en `Body.create` by `Common.nextId`.
     *
     * @property id
     * @type number
     */

    /**
     *Una `Cadena` que indica el tipo de objeto.
     *
     * @property type
     * @type string
     * @default "body"
     * @readOnly
     */

    /**
     * Un nombre de `Cadena` arbitrario para ayudar al usuario a identificar y administrar los cuerpos.
     *
     * @property label
     * @type string
     * @default "Body"
     */

    /**
     * Una serie de cuerpos que componen este cuerpo.
     * El primer cuerpo de la matriz siempre debe ser una referencia propia a la instancia del cuerpo actual.
     * Todos los cuerpos de la matriz `parts` juntos forman un solo cuerpo compuesto rígido.
     * Se permite que las piezas se superpongan, tengan huecos o agujeros o incluso formen cuerpos cóncavos.
     * Las partes en sí mismas nunca deben agregarse a un `Mundo`, solo debe agregarse el cuerpo padre.
     * Utilice `Body.setParts` cuando configure las piezas para garantizar las actualizaciones correctas de todas las propiedades.
     *
     * @property parts
     * @type body[]
     */

    /**
     * Un objeto reservado para almacenar propiedades específicas del complemento.
     *
     * @property plugin
     * @type {}
     */

    /**
     * Una autorreferencia si el cuerpo _not_ es parte de otro cuerpo.
     * De lo contrario, esta es una referencia al cuerpo del que forma parte.
     * Ve `body.parts`.
     *
     * @property parent
     * @type body
     */

    /**
     * Un `Número` que especifica el ángulo del cuerpo, en radianes.
     *
     * @property angle
     * @type number
     * @default 0
     */

    /**
     * Una matriz de objetos `Vector` que especifican el envolvente convexo del cuerpo rígido.
     * Estos deben proporcionarse sobre el origen `(0, 0)`. P.ej.
     *
     *     [{ x: 0, y: 0 }, { x: 25, y: 50 }, { x: 50, y: 0 }]
     *
     * Cuando se pasa a través de `Body.create`, los vértices se traducen en relación con `body.position` (es decir, espacio del mundo, y `Body.update` lo actualiza constantemente durante la simulación).
     * Los objetos `Vector` también se incrementan con propiedades adicionales necesarias para una detección de colisiones eficiente.
     *
     * Otras propiedades como `inercia` y `límmites` se calculan automáticamente a partir de los vértices pasados ​​(a menos que se proporcionen mediante `options`).
     * Los envolventes cóncavos no son compatibles actualmente. El módulo `Matter.Vertices` contiene métodos útiles para trabajar con vértices.
     *
     * @property vertices
     * @type vector[]
     */

    /**
     * Un `Vector` que especifica la posición actual del cuerpo en el espacio del mundo.
     *
     * @property position
     * @type vector
     * @default { x: 0, y: 0 }
     */

    /**
     * Un `Vector` que especifica la fuerza que se aplicará en el paso actual. Se pone a cero después de cada `Body.update`. Consulte también `Body.applyForce`.
     *
     * @property force
     * @type vector
     * @default { x: 0, y: 0 }
     */

    /**
     * Un `Número`  que especifica el torque (fuerza de giro) que se aplicará en el paso actual. Se pone a cero después de cada `Body.update`.
     *
     * @property torque
     * @type number
     * @default 0
     */

    /**
     * Un `Número` _ measures_ (mide) la velocidad actual del cuerpo después de la última ` Body.update`. Es de solo lectura y siempre positivo (es la magnitud de `body.velocity`).
     * 
     * @readOnly
     * @property speed
     * @type number
     * @default 0
     */

    /**
     * Un `Número` que _ measures_ (mide) la velocidad angular actual del cuerpo después de la última ` Body.update`. Es de solo lectura y siempre positivo (es la magnitud de `body.angularVelocity`).
     *
     * @readOnly
     * @property angularSpeed 
     * @type number - número
     * @default 0
     */

    /**
     * Un `Vector` que _ measures_ (mide) la velocidad actual del cuerpo después de la última` Body.update`. Es de solo lectura. 
     * Si necesitas modificar la velocidad de un cuerpo directamente, debes aplicar una fuerza o simplemente cambiar la `posición` del cuerpo (ya que el motor utiliza la integración de Verlet en la posición).
     *
     * @readOnly
     * @property velocity - velocidad
     * @type vector
     * @default { x: 0, y: 0 }
     */

    /**
     * Un `Número` que _measures_ (mide) la velocidad angular actual del cuerpo después de la última ` Body.update`. Es de solo lectura.
     * Si necesitas modificar la velocidad angular de un cuerpo directamente, debes aplicar un torqe o simplemente cambiar el `angulo` del cuerpo (ya que el motor utiliza la integración de Verlet en la posición).
     *
     * @readOnly
     * @property angularVelocity
     * @type number - número
     * @default 0
     */

    /**
     * Una marca que indica si un cuerpo se considera estático. Un cuerpo estático nunca puede cambiar de posición o ángulo y está completamente fijo.
     * Si necesitas configurar un cuerpo como estático después de su creación, debes usar `Body.setStatic` ya que esto requiere más que solo configurar esta marca.
     *
     * @property isStatic
     * @type boolean
     * @default false - falso
     */

    /**
     * Una marca que indica si un cuerpo es un sensor. El sensor desencadena eventos de colisión, pero no reacciona físicamente con el cuerpo que choca.
     *
     * @property isSensor
     * @type boolean
     * @default false - falso
     */

    /**
     * Una marca que indica si el cuerpo se considera dormido. Un cuerpo dormido actúa de manera similar a un cuerpo estático, excepto que es solo temporal y puede despertarse.
     * Si necesitas configurar un cuerpo como durmiente, debes usar `Sleeping.set` ya que esto requiere más que solo configurar esta marca.
     *
     * @property isSleeping
     * @type boolean
     * @default false - falso
     */

    /**
     * Un `Número` que _ measures_ (mide) la cantidad de movimiento que tiene un cuerpo actualmente (una combinación de ` velocidad` y `velocidad angular`). Es de solo lectura y siempre positivo.
     * Es utilizado y actualizado por el módulo `Matter.Sleeping` durante la simulación para decidir si un cuerpo se ha detenido.
     *
     * @readOnly
     * @property motion
     * @type number - número
     * @default 0
     */

    /**
     * Un "Número" que define el número de actualizaciones en las que este cuerpo debe tener una velocidad cercana a cero antes de que el módulo "Matter.Sleeping" lo establezca como inactivo (si el motor habilita el modo inactivo).
     *
     * @property sleepThreshold
     * @type number número
     * @default 60
     */

    /**
     * Un `Número` que define la densidad del cuerpo, es decir, su masa por unidad de área.
     * Si pasas la densidad a través de `Body.create`, la propiedad ` masa` se calcula automáticamente según el tamaño (área) del objeto.
     * Por lo general, esto es preferible a simplemente establecer la masa y permite una definición más intuitiva de los materiales (por ejemplo, la roca tiene una densidad más alta que la madera).
     *
     * @property density - densidad
     * @type number - número
     * @default 0.001
     */

    /**
     * Un `Número` que define la masa del cuerpo, aunque puede ser más apropiado especificar la propiedad `densidad` en su lugar.
     * Si modificas este valor, también debes modificar la propiedad `body.inverseMass` (` 1 / mass`).
     *
     * @property mass - masa
     * @type number - número
     */

    /**
     * Un `Número` que define la masa inversa del cuerpo ("1 / masa").
     * Si modificas este valor, también debes modificar la propiedad `body.mass`.
     *
     * @property inverseMass
     * @type number - número
     */

    /**
     * Un `Número` que define el momento de inercia (es decir, segundo momento de área) del cuerpo.
     * Se calcula automáticamente a partir del envolvente convexo dado (matriz `vértices`) y la densidad en `Body.create`.
     * Si modificas este valor, también debes modificar la propiedad `body.inverseInertia` (`1 / inercia`).
     *
     * @property inertia - inercia
     * @type number - número
     */

    /**
     * Un `Número` que define el momento inverso de inercia del cuerpo ("1 / inercia").
     * Si modificas este valor, también debes modificar la propiedad `body.inertia`.
     *
     * @property inverseInertia
     * @type number
     */

    /**
     * Un `Número` que define la restitución (elasticidad) del cuerpo. El valor es siempre positivo y está en el rango "(0, 1)".
     * Un valor de "0" significa que las colisiones pueden ser perfectamente inelásticas y no pueden producirse rebotes.
     * Un valor de "0.8" significa que el cuerpo puede recuperarse con aproximadamente el 80% de su energía cinética.
     * Ten en cuenta que la respuesta de colisión se basa en _pairs_ (pars) de cuerpos, y que los valores de `restitución`  se _combined_ (combinan) con la siguiente fórmula:
     *
     *     Math.max(bodyA.restitution, bodyB.restitution)
     *
     * @property restitution - restitución
     * @type number - número
     * @default 0
     */

    /**
     * Un `Número` que define la fricción del cuerpo. El valor es siempre positivo y está en el rango "(0, 1)".
     * Un valor de "0" significa que el cuerpo puede deslizarse indefinidamente.
     * Un valor de "1" significa que el cuerpo puede detenerse casi instantáneamente después de aplicar una fuerza.
     *
     * Los efectos del valor pueden no ser lineales. 
     * Los valores altos pueden ser inestables según el cuerpo.
     * El motor utiliza un modelo de fricción de Coulomb que incluye fricción estática y cinética.
     * Ten en cuenta que la respuesta a la colisión se basa en _pairs_ (pares) de cuerpos, y que los valores de `fricción` se _combined_ (combinan) con la siguiente fórmula:
     *
     *     Math.min(bodyA.friction, bodyB.friction)
     *
     * @property friction - fricción
     * @type number - número
     * @default 0.1
     */

    /**
     * Un "Número" que define la fricción estática del cuerpo (en el modelo de fricción de Coulomb). 
     * Un valor de `0` significa que el cuerpo nunca se 'fijará' cuando esté casi estacionario y solo se utiliza la `fricción` dinámica.
     * Cuanto mayor sea el valor (por ejemplo, `10`), más fuerza se necesitará para que el cuerpo se mueva inicialmente cuando esté casi parado.
     * Este valor se multiplica por la propiedad de `fricción` para facilitar el cambio de `fricción` y mantener una cantidad adecuada de fricción estática.
     *
     * @property frictionStatic
     * @type number - número
     * @default 0.5
     */

    /**
     * Un `Número` que define la fricción del aire del cuerpo (resistencia del aire).
     * Un valor de `0` significa que el cuerpo nunca se ralentizará mientras se mueve por el espacio.
     * Cuanto mayor sea el valor, más rápido se ralentiza un cuerpo cuando se mueve por el espacio.
     * Los efectos del valor no son lineales.
     *
     * @property frictionAir
     * @type number - número
     * @default 0.01
     */

    /**
     * Un `Objeto` que especifica las propiedades de filtrado de colisiones de este cuerpo.
     *
     * Las colisiones entre dos cuerpos obedecerán las siguientes reglas:
     * - Si los dos cuerpos tienen el mismo valor distinto de cero de `collisionFilter.group`,
     *   siempre chocarán si el valor es positivo, y nunca chocarán* siempre chocarán si el valor es positivo, y nunca chocarán
     *   si el valor es negativo.
     * - Si los dos cuerpos tienen valores diferentes de `collisionFilter.group` o si uno
     *   (o ambos) de los cuerpos tiene un valor de 0, entonces las reglas de categoría / máscara se aplican de la siguiente manera:
     *
     * Cada cuerpo pertenece a una categoría de colisión, dada por `collisionFilter.category`. Este
     * valor se utiliza como un campo de bits y la categoría debe tener solo un bit establecido, lo que significa que
     * el valor de esta propiedad es una potencia de dos en el rango [1,2^31]. Por lo tanto, hay 32
     * diferentes categorías de colisión disponibles.
     *
     * Cada cuerpo también define una máscara de bits de colisión, dada por `collisionFilter.mask` que especifica
     * las categorías con las que colisiona (el valor es la operación bit a bit AND de todas las categorías).
     *
     * Usando las reglas de categoría / máscara, dos cuerpos `A` y` B` chocan si cada uno incluye al otro.
     * categoría en su máscara, es decir, `(categoryA y maskB)! == 0` y` (categoryB y maskA)! == 0`
     * ambas son ciertas
     *
     * @property collisionFilter
     * @type object
     */

    /**
     * Un `Número` entero que especifica el grupo de colisión al que pertenece este cuerpo.
     * Consulta `body.collisionFilter` para obtener más información.
     *
     * @property collisionFilter.group
     * @type object - objeto
     * @default 0
     */

    /**
     * Un campo de bits que especifica la categoría de colisión a la que pertenece este cuerpo.
     * El valor de la categoría debe tener solo un bit establecido, por ejemplo, `0x0001`.
     * Esto significa que hay hasta 32 categorías de colisión únicas disponibles.
     * Consulta `body.collisionFilter` para obtener más información.
     *
     * @property collisionFilter.category
     * @type object - objeto
     * @default 1
     */

    /**
     * Una máscara de bits que especifica las categorías de colisión con las que este cuerpo puede colisionar.
     * Consulte `body.collisionFilter` para obtener más información.
     *
     * @property collisionFilter.mask
     * @type object
     * @default -1
     */

    /**
     * Un `Número` que especifica una tolerancia sobre hasta qué punto se permite que un cuerpo se 'sink' o gire hacia otros cuerpos.
     * Evita cambiar este valor a menos que comprenda el propósito de `slop` en los motores físicos.
     * Generalmente, el valor predeterminado debería ser suficiente, aunque los cuerpos muy grandes pueden requerir valores mayores para un apilamiento estable.
     *
     * @property slop
     * @type number - número
     * @default 0.05
     */

    /**
     * Un `Número` que permite escalar el tiempo por cuerpo, p. Ej. un campo de fuerza en el que los cuerpos del interior están en cámara lenta, mientras que otros lo hacen a toda velocidad.
     *
     * @property timeScale
     * @type number - número
     * @default 1
     */

    /**
     * Un `Objeto` que define las propiedades de renderizado que consumirá el módulo `Matter.Render`.
     *
     * @property render - renderizar
     * @type object - objeto
     */

    /**
     * Una marca que indica si se debe renderizar el cuerpo.
     *
     * @property render.visible
     * @type boolean
     * @default true - verdadero
     */

    /**
     * Establece la opacidad que se utilizará al renderizar.
     *
     * @property render.opacity
     * @type number - número
     * @default 1
    */

    /**
     * Un `Objeto` que define las propiedades del sprite que se usarán al renderizar, si las hay.
     *
     * @property render.sprite
     * @type object - objeto
     */

    /**
     * Una `Cadena` que define la ruta a la imagen que se utilizará como textura del sprite, si corresponde.
     *
     * @property render.sprite.texture
     * @type string - cadena
     */
     
    /**
     * Un `Número` que define la escala en el eje x del sprite, si lo hubiera.
     *
     * @property render.sprite.xScale
     * @type number - número
     * @default 1
     */

    /**
     * Un `Número` que define la escala en el eje y del sprite, si lo hay.
     *
     * @property render.sprite.yScale
     * @type number - número
     * @default 1
     */

     /**
      * Un `Número` que define el desplazamiento en el eje x del sprite (normalizado por el ancho de la textura).
      *
      * @property render.sprite.xOffset
      * @type number - número
      * @default 0
      */

     /**
      * Un `Número` que define el desplazamiento en el eje y para el objeto (normalizado por la altura de la textura).
      *
      * @property render.sprite.yOffset
      * @type number - número
      * @default 0
      */

    /**
     * Un `Número` que define el ancho de línea que se utilizará al representar el contorno del cuerpo (si no se define un sprite).
     * Un valor de `0` significa que no se representará ningún contorno.
     *
     * @property render.lineWidth
     * @type number - número
     * @default 1.5
     */

    /**
     * Una `Cadena` que define el estilo de relleno que se utilizará al representar el cuerpo (si no se define un sprite).
     * Es lo mismo que cuando se usa un lienzo, por lo que acepta valores de propiedad de estilo CSS.
     *
     * @property render.fillStyle
     * @type string - cadena
     * @default a random colour - un color aleatorio	
     */

    /**
     * Una `Cadena` que define el estilo de trazo que se utilizará al representar el contorno del cuerpo (si no se define un sprite).
     * Es lo mismo que cuando se usa un lienzo, por lo que acepta valores de propiedad de estilo CSS.
     *
     * @property render.strokeStyle
     * @type string - cadena
     * @default a random colour - un color aleatorio
     */

    /**
     * Una matriz de vectores de eje únicos (normales  borde) que se utilizan para la detección de colisiones.
     * Estos se calculan automáticamente a partir del envolvente convexo dado (`vértices` array) en `Body.create`.
     * Durante la simulación constantemente los actualiza `Body.update`
     *
     * @property axes - ejes
     * @type vector[]
     */
     
    /**
     * Un `Número` que _ measures_ (mide) el área del envolvente convexo del cuerpo, calculado en el momento de la creación por `Body.create`.
     *
     * @property area - área
     * @type string - cadena
     * @default 
     */

    /**
     * Un objeto "Límites" que define la región AABB del cuerpo.
     * Se calcula automáticamente a partir del envolvente convexo dado ("vértices" array) en "Body.create" y "Body.update" lo actualiza constantemente durante la simulación.
     *
     * @property bounds - límites
     * @type bounds - límites
     */

})();

},{"../core/Common":14,"../core/Sleeping":22,"../geometry/Axes":25,"../geometry/Bounds":26,"../geometry/Vector":28,"../geometry/Vertices":29,"../render/Render":31}],2:[function(_dereq_,module,exports){
/**
* El módulo `Matter.Composite` contiene métodos para crear y manipular cuerpos compuestos.
* A composite body is a collection of `Matter.Body`, `Matter.Constraint` and other `Matter.Composite`, therefore composites form a tree structure.
* Es importante utilizar las funciones de este módulo para modificar compuestos, en lugar de modificar directamente sus propiedades.
* Ten en cuenta que el objeto `Matter.World` también es un tipo de` Matter.Composite` y, como tal, todos los métodos compuestos aquí también pueden operar en un `Matter.World`.
*
* Ve el uso incluido [ejemplos](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Composite
*/

var Composite = {};

module.exports = Composite;

var Events = _dereq_('../core/Events');
var Common = _dereq_('../core/Common');
var Body = _dereq_('./Body');

(function() {

    /**
     * Crea un nuevo compuesto. El parámetro de opciones es un objeto que especifica cualquier propiedad que desees anular de los valores predeterminados.
     * Consulte la sección de propiedades a continuación para obtener información detallada sobre lo que puede pasar a través del objeto `options`.
     * @method create - crear
     * @param {} [options]
     * @return {composite} A new composite - Un nuevo compuesto
     */
    Composite.create = function(options) {
        return Common.extend({ 
            id: Common.nextId(),
            type: 'composite',
            parent: null,
            isModified: false,
            bodies: [], 
            constraints: [], 
            composites: [],
            label: 'Composite',
            plugin: {}
        }, options);
    };

    /**
     * Establece la marca 'isModified' del compuesto.
     * If `updateParents` is true, all parents will be set (default: false).
     * If `updateChildren` is true, all children will be set (default: false).
     * @method setModified
     * @param {composite} composite
     * @param {boolean} isModified
     * @param {boolean} [updateParents=false]
     * @param {boolean} [updateChildren=false]
     */
    Composite.setModified = function(composite, isModified, updateParents, updateChildren) {
        composite.isModified = isModified;

        if (updateParents && composite.parent) {
            Composite.setModified(composite.parent, isModified, updateParents, updateChildren);
        }

        if (updateChildren) {
            for(var i = 0; i < composite.composites.length; i++) {
                var childComposite = composite.composites[i];
                Composite.setModified(childComposite, isModified, updateParents, updateChildren);
            }
        }
    };

    /**
     * Función de adición genérica. Agrega uno o varios cuerpos, restricciones o un compuesto al compuesto dado.
     * Activa los eventos `beforeAdd` y `afterAdd` en el `composite`.
     * @method add - agregar
     * @param {composite} composite - compuesto
     * @param {} object - objeto
     * @return {composite} El compuesto original con los objetos añadidos.
     */
    Composite.add = function(composite, object) {
        var objects = [].concat(object);

        Events.trigger(composite, 'beforeAdd', { object: object });

        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];

            switch (obj.type) {

            case 'body':
                // omitir la adición de partes compuestas
                if (obj.parent !== obj) {
                    Common.warn('Composite.add: omite agregar una parte de cuerpo compuesta (debes agregar su padre en su lugar) ');
                    break;
                }

                Composite.addBody(composite, obj);
                break;
            case 'constraint':
                Composite.addConstraint(composite, obj);
                break;
            case 'composite':
                Composite.addComposite(composite, obj);
                break;
            case 'mouseConstraint':
                Composite.addConstraint(composite, obj.constraint);
                break;

            }
        }

        Events.trigger(composite, 'afterAdd', { object: object });

        return composite;
    };

    /**
     * Función de eliminación genérica. Elimina uno o varios cuerpos, restricciones o un compuesto al compuesto dado.
     * Opcionalmente buscando a sus elementos secundarios recursivamente.
     * Activa los eventos `beforeRemove` y `afterRemove` en el `composite`.
     * @method remove - remover
     * @param {composite} composite - compuesto
     * @param {} object - objeto
     * @param {boolean} [deep=false]
     * @return {composite} El compuesto original con los objetos eliminados.
     */
    Composite.remove = function(composite, object, deep) {
        var objects = [].concat(object);

        Events.trigger(composite, 'beforeRemove', { object: object });

        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];

            switch (obj.type) {

            case 'body':
                Composite.removeBody(composite, obj, deep);
                break;
            case 'constraint':
                Composite.removeConstraint(composite, obj, deep);
                break;
            case 'composite':
                Composite.removeComposite(composite, obj, deep);
                break;
            case 'mouseConstraint':
                Composite.removeConstraint(composite, obj.constraint);
                break;

            }
        }

        Events.trigger(composite, 'afterRemove', { object: object });

        return composite;
    };

    /**
     * Agrega un compuesto al compuesto dado.
     * @private
     * @method addComposite
     * @param {composite} compositeA
     * @param {composite} compositeB
     * @return {composite} El compositeA original con los objetos del compositeB agregados
     */
    Composite.addComposite = function(compositeA, compositeB) {
        compositeA.composites.push(compositeB);
        compositeB.parent = compositeA;
        Composite.setModified(compositeA, true, true, false);
        return compositeA;
    };

    /**
     * Elimina un compuesto del compuesto dado y, opcionalmente, busca sus elementos secundarios de forma recursiva.
     * @private
     * @method removeComposite
     * @param {composite} compositeA
     * @param {composite} compositeB
     * @param {boolean} [deep=false]
     * @return {composite} El compositeA original con el compuesto eliminado
     */
    Composite.removeComposite = function(compositeA, compositeB, deep) {
        var position = Common.indexOf(compositeA.composites, compositeB);
        if (position !== -1) {
            Composite.removeCompositeAt(compositeA, position);
            Composite.setModified(compositeA, true, true, false);
        }

        if (deep) {
            for (var i = 0; i < compositeA.composites.length; i++){
                Composite.removeComposite(compositeA.composites[i], compositeB, true);
            }
        }

        return compositeA;
    };

    /**
     * Elimina un compuesto del compuesto dado.
     * @private
     * @method removeCompositeAt
     * @param {composite} composite - compuesto
     * @param {number} position - posición
     * @return {composite} El compuesto original con el compuesto eliminado
     */
    Composite.removeCompositeAt = function(composite, position) {
        composite.composites.splice(position, 1);
        Composite.setModified(composite, true, true, false);
        return composite;
    };

    /**
     * Agrega un cuerpo al compuesto dado.
     * @private
     * @method addBody
     * @param {composite} composite - compuesto
     * @param {body} body - cuerpo
     * @return {composite} El compuesto original con el cuerpo añadido
     */
    Composite.addBody = function(composite, body) {
        composite.bodies.push(body);
        Composite.setModified(composite, true, true, false);
        return composite;
    };

    /**
     * Elimina un cuerpo del compuesto dado y, opcionalmente, busca sus elementos secundarios de forma recursiva.
     * @private
     * @method removeBody
     * @param {composite} composite - compuesto
     * @param {body} body - cuerpo
     * @param {boolean} [deep=false]
     * @return {composite} El compuesto original con el cuerpo retirado
     */
    Composite.removeBody = function(composite, body, deep) {
        var position = Common.indexOf(composite.bodies, body);
        if (position !== -1) {
            Composite.removeBodyAt(composite, position);
            Composite.setModified(composite, true, true, false);
        }

        if (deep) {
            for (var i = 0; i < composite.composites.length; i++){
                Composite.removeBody(composite.composites[i], body, true);
            }
        }

        return composite;
    };

    /**
     * Elimina un cuerpo del compuesto dado.
     * @private
     * @method removeBodyAt
     * @param {composite} composite - compuesto
     * @param {number} position - posición
     * @return {composite} El compuesto original con el cuerpo removido
     */
    Composite.removeBodyAt = function(composite, position) {
        composite.bodies.splice(position, 1);
        Composite.setModified(composite, true, true, false);
        return composite;
    };

    /**
     * Agrega una restricción al compuesto dado.
     * @private
     * @method addConstraint
     * @param {composite} composite - compuesto
     * @param {constraint} constraint - restricción
     * @return {composite} El compuesto original con la restricción agregada
     */
    Composite.addConstraint = function(composite, constraint) {
        composite.constraints.push(constraint);
        Composite.setModified(composite, true, true, false);
        return composite;
    };

    /**
     * Elimina una restricción del compuesto dado y, opcionalmente, busca sus elementos secundarios de forma recursiva.
     * @private
     * @method removeConstraint
     * @param {composite} composite - compuesto
     * @param {constraint} constraint - restricción
     * @param {boolean} [deep=false]
     * @return {composite} El compuesto original con la restricción eliminada
     */
    Composite.removeConstraint = function(composite, constraint, deep) {
        var position = Common.indexOf(composite.constraints, constraint);
        if (position !== -1) {
            Composite.removeConstraintAt(composite, position);
        }

        if (deep) {
            for (var i = 0; i < composite.composites.length; i++){
                Composite.removeConstraint(composite.composites[i], constraint, true);
            }
        }

        return composite;
    };

    /**
     * Elimina un cuerpo del compuesto dado.
     * @private
     * @method removeConstraintAt
     * @param {composite} composite - compuesto
     * @param {number} position - posición
     * @return {composite} El compuesto original con la restricción eliminada
     */
    Composite.removeConstraintAt = function(composite, position) {
        composite.constraints.splice(position, 1);
        Composite.setModified(composite, true, true, false);
        return composite;
    };

    /**
     * Elimina todos los cuerpos, restricciones y compuestos del compuesto dado.
     * Opcionalmente despejando a sus elementos secundarios recursivamente.
     * @method clear
     * @param {composite} composite - compuesto
     * @param {boolean} keepStatic
     * @param {boolean} [deep=false]
     */
    Composite.clear = function(composite, keepStatic, deep) {
        if (deep) {
            for (var i = 0; i < composite.composites.length; i++){
                Composite.clear(composite.composites[i], keepStatic, true);
            }
        }
        
        if (keepStatic) {
            composite.bodies = composite.bodies.filter(function(body) { return body.isStatic; });
        } else {
            composite.bodies.length = 0;
        }

        composite.constraints.length = 0;
        composite.composites.length = 0;
        Composite.setModified(composite, true, true, false);

        return composite;
    };

    /**
     * Devuelve todos los cuerpos del compuesto dado, incluidos todos los cuerpos de sus elementos secundarios, de forma recursiva.
     * @method allBodies
     * @param {composite} composite - compuesto
     * @return {body[]} Todos los cuerpos
     */
    Composite.allBodies = function(composite) {
        var bodies = [].concat(composite.bodies);

        for (var i = 0; i < composite.composites.length; i++)
            bodies = bodies.concat(Composite.allBodies(composite.composites[i]));

        return bodies;
    };

    /**
     * Devuelve todas las restricciones en el compuesto dado, incluidas todas las restricciones en sus elementos secundarios, de forma recursiva.
     * @method allConstraints
     * @param {composite} composite - compuesto
     * @return {constraint[]} Todas las restricciones
     */
    Composite.allConstraints = function(composite) {
        var constraints = [].concat(composite.constraints);

        for (var i = 0; i < composite.composites.length; i++)
            constraints = constraints.concat(Composite.allConstraints(composite.composites[i]));

        return constraints;
    };

    /**
     * Devuelve todos los compuestos en el compuesto dado, incluidos todos los compuestos en sus elementos secundarios, de forma recursiva.
     * @method allComposites
     * @param {composite} composite - compuesto
     * @return {composite[]} Todos los compuestos
     */
    Composite.allComposites = function(composite) {
        var composites = [].concat(composite.composites);

        for (var i = 0; i < composite.composites.length; i++)
            composites = composites.concat(Composite.allComposites(composite.composites[i]));

        return composites;
    };

    /**
     * Busca en el compuesto de forma recursiva un objeto que coincida con el tipo y la identificación suministrados, nulo si no se encuentra.
     * @method get - obtener
     * @param {composite} composite - compuesto
     * @param {number} id - identificación
     * @param {string} type - tipo
     * @return {object} El objeto solicitado, si se encuentra
     */
    Composite.get = function(composite, id, type) {
        var objects,
            object;

        switch (type) {
        case 'body':
            objects = Composite.allBodies(composite);
            break;
        case 'constraint':
            objects = Composite.allConstraints(composite);
            break;
        case 'composite':
            objects = Composite.allComposites(composite).concat(composite);
            break;
        }

        if (!objects)
            return null;

        object = objects.filter(function(object) { 
            return object.id.toString() === id.toString(); 
        });

        return object.length === 0 ? null : object[0];
    };

    /**
     * Mueve los objetos dados de compositeA a compositeB (igual a eliminar seguido de agregar).
     * @method move - mover
     * @param {compositeA} compositeA
     * @param {object[]} objects - objetos
     * @param {compositeB} compositeB
     * @return {composite} Devuelve compositeA
     */
    Composite.move = function(compositeA, objects, compositeB) {
        Composite.remove(compositeA, objects);
        Composite.add(compositeB, objects);
        return compositeA;
    };

    /**
     * Asigna nuevos identificadores para todos los objetos del compuesto, de forma recursiva.
     * @method rebase
     * @param {composite} composite - compuesto
     * @return {composite} Devuelve compuesto
     */
    Composite.rebase = function(composite) {
        var objects = Composite.allBodies(composite)
                        .concat(Composite.allConstraints(composite))
                        .concat(Composite.allComposites(composite));

        for (var i = 0; i < objects.length; i++) {
            objects[i].id = Common.nextId();
        }

        Composite.setModified(composite, true, true, false);

        return composite;
    };

    /**
     * Traslada todos los elementos secundarios en el compuesto por un vector dado en relación con sus posiciones actuales,
     * sin impartir ninguna velocidad.
     * @method translate - traslada
     * @param {composite} composite - compuesto
     * @param {vector} translation - traslado
     * @param {bool} [recursive=true]
     */
    Composite.translate = function(composite, translation, recursive) {
        var bodies = recursive ? Composite.allBodies(composite) : composite.bodies;

        for (var i = 0; i < bodies.length; i++) {
            Body.translate(bodies[i], translation);
        }

        Composite.setModified(composite, true, true, false);

        return composite;
    };

    /**
     * Gira a todos los elementos secundarios en el compuesto en un ángulo dado alrededor del punto dado, sin impartir velocidad angular.
     * @method rotate - rotar
     * @param {composite} composite - compuesto
     * @param {number} rotation - rotar
     * @param {vector} point - punto
     * @param {bool} [recursive=true]
     */
    Composite.rotate = function(composite, rotation, point, recursive) {
        var cos = Math.cos(rotation),
            sin = Math.sin(rotation),
            bodies = recursive ? Composite.allBodies(composite) : composite.bodies;

        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i],
                dx = body.position.x - point.x,
                dy = body.position.y - point.y;
                
            Body.setPosition(body, {
                x: point.x + (dx * cos - dy * sin),
                y: point.y + (dx * sin + dy * cos)
            });

            Body.rotate(body, rotation);
        }

        Composite.setModified(composite, true, true, false);

        return composite;
    };

    /**
     * Escala todos los elementos secundarios en el compuesto, incluida la actualización de las propiedades físicas (masa, área, ejes, inercia), desde un punto del espacio del mundo.
     * @method scale - escala
     * @param {composite} composite - compuesto
     * @param {number} scaleX
     * @param {number} scaleY
     * @param {vector} point - punto
     * @param {bool} [recursive=true]
     */
    Composite.scale = function(composite, scaleX, scaleY, point, recursive) {
        var bodies = recursive ? Composite.allBodies(composite) : composite.bodies;

        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i],
                dx = body.position.x - point.x,
                dy = body.position.y - point.y;
                
            Body.setPosition(body, {
                x: point.x + dx * scaleX,
                y: point.y + dy * scaleY
            });

            Body.scale(body, scaleX, scaleY);
        }

        Composite.setModified(composite, true, true, false);

        return composite;
    };

    /*
    *
    *  Documentación de eventos
    *
    */

    /**
    * Se activa cuando se realiza una llamada a `Composite.add`, antes de que se hayan agregado los objetos.
    *
    * @event beforeAdd
    * @param {} event An event object - Un objeto de evento
    * @param {} event.object Los objetos que se agregarán (pueden ser un solo cuerpo, restricción, compuesto o una matriz mixta de estos)
    * @param {} event.source El objeto fuente del evento
    * @param {} event.name El nombre del evento
    */

    /**
    * Se activa cuando se realiza una llamada a `Composite.add`, después de que se han agregado objetos.
    *
    * @event afterAdd
    * @param {} event Un objeto de evento
    * @param {} event.object Los objetos que se han agregado (pueden ser un solo cuerpo, restricción, compuesto o una matriz mixta de estos)
    * @param {} event.source El objeto fuente del evento
    * @param {} event.name El nombre del evento
    */

    /**
    * Se activa cuando se realiza una llamada a `Composite.remove`, antes de que se hayan eliminado los objetos.
    *
    * @event beforeRemove
    * @param {} event Un objeto de evento
    * @param {} event.object El (los) objeto (s) que se eliminarán (puede ser un solo cuerpo, restricción, compuesto o una matriz mixta de estos)
    * @param {} event.source The source object of the event
    * @param {} event.name El nombre del evento
    */

    /**
    * Se activa cuando se realiza una llamada a `Composite.remove`, después de que se hayan eliminado los objetos.
    *
    * @event afterRemove
    * @param {} event Un objeto de evento
    * @param {} event.object Los objetos que se han eliminado (pueden ser un solo cuerpo, restricción, compuesto o una matriz mixta de estos)
    * @param {} event.source El objeto fuente del evento
    * @param {} event.name El nombre del evento
    */

    /*
    *
    *  Documentación de propiedades
    *
    */

    /**
     * Un `Número` entero de identificación única generado en `Composite.create` por `Common.nextId`.
     *
     * @property id - identifiación
     * @type number - número
     */

    /**
     * Una `Cadena` que indica el tipo de objeto.
     *
     * @property type - tipo
     * @type string - cadena
     * @default "composite"
     * @readOnly
     */

    /**
     * Un nombre de `Cadena` arbitrario para ayudar al usuario a identificar y administrar compuestos.
     *
     * @property label - etiqueta
     * @type string - cadena
     * @default "Composite"
     */

    /**
     * Una marca que especifica si el compuesto se ha modificado durante el paso actual.
     * La mayoría de los métodos `Matter.Composite` establecerán automáticamente esta marca en `true` para informar al motor de los cambios que se deben manejar.
     * Si necesita cambiarlo manualmente, debe usar el método `Composite.setModified`.
     *
     * @property isModified
     * @type boolean - booleano
     * @default false - falso 
     */

    /**
     * El `Compuesto` que es el padre de este compuesto. Es administrado automáticamente por los métodos `Matter.Composite`.
     *
     * @property parent - padre
     * @type composite - compuesto
     * @default null - nulo 
     */

    /**
     * Una matriz de `Cuerpo` que son elementos secundarios _direct_ (directo) de este compuesto.
     * Para agregar o eliminar cuerpos, debe usar los métodos `Composite.add` y `Composite.remove` en lugar de modificar directamente esta propiedad.
     * Si deseas buscar de forma recursiva todos los descendientes, debes utilizar el método `Composite.allBodies`.
     *
     * @property bodies - cuerpos
     * @type body[]
     * @default []
     */

    /**
     * Una matriz de `Restricción` que son elementos secundarios _direct_ (directos) de este compuesto.
     * Para agregar o eliminar restricciones, debe usar los métodos `Composite.add` y` Composite.remove` en lugar de modificar directamente esta propiedad.
     * Si deseas buscar de forma recursiva todos los descendientes, debes utilizar el método `Composite.allConstraints`.
     *
     * @property constraints - restricciones
     * @type constraint[]
     * @default []
     */

    /**
     * Una matriz de `Compuesto` que son elementos secundarios _direct_ (directos) de este compuesto.
     * Para agregar o eliminar compuestos, debes usar los métodos `Composite.add` y `Composite.remove` en lugar de modificar directamente esta propiedad.
     * Si desea buscar de forma recursiva todos los descendientes, debe utilizar el método `Composite.allComposites`.
     *
     * @property composites - compuestos	
     * @type composite[]
     * @default []
     */

    /**
     * Un objeto reservado para almacenar propiedades específicas del complemento.
     *
     * @property plugin 
     * @type {}
     */

})();

},{"../core/Common":14,"../core/Events":16,"./Body":1}],3:[function(_dereq_,module,exports){
/**
* El módulo `Matter.World` contiene métodos para crear y manipular el mundo compuesto.
* Un `Matter.World` es un cuerpo de `Matter.Composite`, que es una colección de `Matter.Body`, `Matter.Constraint` y otros `Matter.Composite`.
* Un "Matter.World" tiene algunas propiedades adicionales que incluyen "gravedad" y "límites".
* Es importante utilizar las funciones del módulo `Matter.Composite` para modificar el mundo compuesto, en lugar de modificar directamente sus propiedades.
* También hay algunos métodos aquí que alias los de `Matter.Composite` para facilitar la lectura.
*
* Ver el uso incluido [ejemplos](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class World - Mundo
* @extends Composite - compuestos
*/

var World = {};

module.exports = World;

var Composite = _dereq_('./Composite');
var Constraint = _dereq_('../constraint/Constraint');
var Common = _dereq_('../core/Common');

(function() {

    /**
     * Crea un nuevo mundo compuesto. El parámetro de opciones es un objeto que especifica las propiedades que desea anular los valores predeterminados.
     * Consulta la sección de propiedades a continuación para obtener información detallada sobre lo que puede pasar a través del objeto `options`.
     * @method create - crear
     * @constructor
     * @param {} options - opciones
     * @return {world} Un nuevo mundo
     */
    World.create = function(options) {
        var composite = Composite.create();

        var defaults = {
            label: 'World',
            gravity: {
                x: 0,
                y: 1,
                scale: 0.001
            },
            bounds: { 
                min: { x: -Infinity, y: -Infinity }, 
                max: { x: Infinity, y: Infinity } 
            }
        };
        
        return Common.extend(composite, defaults, options);
    };

    /*
    *
    *  Documentación de propiedades
    *
    */

    /**
     * La gravedad para aplicar en el mundo.
     *
     * @property gravity - gravedad
     * @type object - objeto
     */

    /**
     * El componente de gravedad x.
     *
     * @property gravity.x
     * @type object - objeto
     * @default 0
     */

    /**
     * El componente de gravedad y.
     *
     * @property gravity.y
     * @type object - objeto
     * @default 1
     */

    /**
     * El factor de escala de gravedad.
     *
     * @property gravity.scale
     * @type object - objeto
     * @default 0.001
     */

    /**
     * Un objeto `Bounds` que define los límites mundiales para la detección de colisiones.
     *
     * @property bounds - límites
     * @type bounds - lìmites
     * @default { min: { x: -Infinity, y: -Infinity }, max: { x: Infinity, y: Infinity } }
     */

    // El mundo es un cuerpo compuesto
    // see src/module/Outro.js for these aliases:
    
    /**
     * Un alias para Composite.clear
     * @method clear - despejar
     * @param {world} world - mundo
     * @param {boolean} keepStatic
     */

    /**
     * Un alias para Composite.add
     * @method addComposite
     * @param {world} world - mundo
     * @param {composite} composite - compuesto
     * @return {world} El mundo original con los objetos del compuesto agregados
     */
    
     /**
      * Un alias para Composite.addBody
      * @method addBody
      * @param {world} world - mundo
      * @param {body} body - cuerpo
      * @return {world} El mundo original con los objetos del compuesto agregados
      */

     /**
      * Un alias para Composite.addConstraint
      * @method addConstraint
      * @param {world} world - mundo
      * @param {constraint} constraint - restricción
      * @return {world} El mundo original con la restricción agregada
      */

})();

},{"../constraint/Constraint":12,"../core/Common":14,"./Composite":2}],4:[function(_dereq_,module,exports){
/**
* El módulo `Matter.Contact` contiene métodos para crear y manipular contactos de colisión.
*
* @class Contact
*/

var Contact = {};

module.exports = Contact;

(function() {

    /**
     * Crea un nuevo contacto.
     * @method create - crear
     * @param {vertex} vertex - vértice
     * @return {contact} Un nuevo contacto.
     */
    Contact.create = function(vertex) {
        return {
            id: Contact.id(vertex),
            vertex: vertex,
            normalImpulse: 0,
            tangentImpulse: 0
        };
    };
    
    /**
     * Genera una identificación de contacto.
     * @method id - identificación
     * @param {vertex} vertex - vértice
     * @return {string} contactID único
     */
    Contact.id = function(vertex) {
        return vertex.body.id + '_' + vertex.index;
    };

})();

},{}],5:[function(_dereq_,module,exports){
/**
* El módulo `Matter.Detector` contiene métodos para detectar colisiones dado un conjunto de pares.
*
* @class Detector - Detector
*/

// TODO: contactos especulativos

var Detector = {};

module.exports = Detector;

var SAT = _dereq_('./SAT');
var Pair = _dereq_('./Pair');
var Bounds = _dereq_('../geometry/Bounds');

(function() {

    /**
     * Encuentra todas las colisiones dada una lista de pares.
     * @method collisions - colisiones
     * @param {pair[]} broadphasePairs
     * @param {engine} engine - motor
     * @return {array} collisions - colisiones
     */
    Detector.collisions = function(broadphasePairs, engine) {
        var collisions = [],
            pairsTable = engine.pairs.table;

        
        for (var i = 0; i < broadphasePairs.length; i++) {
            var bodyA = broadphasePairs[i][0], 
                bodyB = broadphasePairs[i][1];

            if ((bodyA.isStatic || bodyA.isSleeping) && (bodyB.isStatic || bodyB.isSleeping))
                continue;
            
            if (!Detector.canCollide(bodyA.collisionFilter, bodyB.collisionFilter))
                continue;


            // fase media
            if (Bounds.overlaps(bodyA.bounds, bodyB.bounds)) {
                for (var j = bodyA.parts.length > 1 ? 1 : 0; j < bodyA.parts.length; j++) {
                    var partA = bodyA.parts[j];

                    for (var k = bodyB.parts.length > 1 ? 1 : 0; k < bodyB.parts.length; k++) {
                        var partB = bodyB.parts[k];

                        if ((partA === bodyA && partB === bodyB) || Bounds.overlaps(partA.bounds, partB.bounds)) {
                            // encontrar una colisión anterior que podamos reutilizar
                            var pairId = Pair.id(partA, partB),
                                pair = pairsTable[pairId],
                                previousCollision;

                            if (pair && pair.isActive) {
                                previousCollision = pair.collision;
                            } else {
                                previousCollision = null;
                            }

                            // fase estrecha
                            var collision = SAT.collides(partA, partB, previousCollision);


                            if (collision.collided) {
                                collisions.push(collision);
                            }
                        }
                    }
                }
            }
        }

        return collisions;
    };

    /**
     * Devuelve `true` si ambos filtros de colisión suministrados permitirán que ocurra una colisión.
     * Consulta `body.collisionFilter` para obtener más información.
     * @method canCollide
     * @param {} filterA
     * @param {} filterB
     * @return {bool} `true` si puede ocurrir una colisión
     */
    Detector.canCollide = function(filterA, filterB) {
        if (filterA.group === filterB.group && filterA.group !== 0)
            return filterA.group > 0;

        return (filterA.mask & filterB.category) !== 0 && (filterB.mask & filterA.category) !== 0;
    };

})();

},{"../geometry/Bounds":26,"./Pair":7,"./SAT":11}],6:[function(_dereq_,module,exports){
/**
* El módulo `Matter.Grid` contiene métodos para crear y manipular estructuras de cuadrícula de fase ancha de colisión.
*
* @class Cuadrícula
*/

var Grid = {};

module.exports = Grid;

var Pair = _dereq_('./Pair');
var Detector = _dereq_('./Detector');
var Common = _dereq_('../core/Common');

(function() {

    /**
     * Crea una nueva cuadrícula.
     * @method create - crear
     * @param {} options - opciones
     * @return {grid} Una nueva cuadricula
     */
    Grid.create = function(options) {
        var defaults = {
            controller: Grid,
            detector: Detector.collisions,
            buckets: {},
            pairs: {},
            pairsList: [],
            bucketWidth: 48,
            bucketHeight: 48
        };

        return Common.extend(defaults, options);
    };

    /**
     * El ancho del ordenamiento por casilleros de una sola rejilla.
     *
     * @property bucketWidth
     * @type number - número
     * @default 48
     */

    /**
     * La altura del ordenamiento por casilleros de una sola rejilla.
     *
     * @property bucketHeight
     * @type number - número
     * @default 48
     */

    /**
     * Actualiza la cuadrícula.
     * @method update - actualización
     * @param {grid} grid - red
     * @param {body[]} bodies - cuerpos
     * @param {engine} engine - motor
     * @param {boolean} forceUpdate
     */
    Grid.update = function(grid, bodies, engine, forceUpdate) {
        var i, col, row,
            world = engine.world,
            buckets = grid.buckets,
            bucket,
            bucketId,
            gridChanged = false;


        for (i = 0; i < bodies.length; i++) {
            var body = bodies[i];

            if (body.isSleeping && !forceUpdate)
                continue;

            // no actualice los cuerpos del mundo
            if (body.bounds.max.x < world.bounds.min.x || body.bounds.min.x > world.bounds.max.x
                || body.bounds.max.y < world.bounds.min.y || body.bounds.min.y > world.bounds.max.y)
                continue;

            var newRegion = _getRegion(grid, body);

            // si el cuerpo ha cambiado la región de la cuadrícula
            if (!body.region || newRegion.id !== body.region.id || forceUpdate) {


                if (!body.region || forceUpdate)
                    body.region = newRegion;

                var union = _regionUnion(newRegion, body.region);

                // actualizar los depósitos de la cuadrícula afectados por el cambio de región
                // iterar sobre la unión de ambas regiones
                for (col = union.startCol; col <= union.endCol; col++) {
                    for (row = union.startRow; row <= union.endRow; row++) {
                        bucketId = _getBucketId(col, row);
                        bucket = buckets[bucketId];

                        var isInsideNewRegion = (col >= newRegion.startCol && col <= newRegion.endCol
                                                && row >= newRegion.startRow && row <= newRegion.endRow);

                        var isInsideOldRegion = (col >= body.region.startCol && col <= body.region.endCol
                                                && row >= body.region.startRow && row <= body.region.endRow);

                        // eliminar de los agrupamientos de regiones antiguas
                        if (!isInsideNewRegion && isInsideOldRegion) {
                            if (isInsideOldRegion) {
                                if (bucket)
                                    _bucketRemoveBody(grid, bucket, body);
                            }
                        }

                        // agregar a nuevos agrupamientos de región
                        if (body.region === newRegion || (isInsideNewRegion && !isInsideOldRegion) || forceUpdate) {
                            if (!bucket)
                                bucket = _createBucket(buckets, bucketId);
                            _bucketAddBody(grid, bucket, body);
                        }
                    }
                }

                // establecer la nueva región
                body.region = newRegion;

                // cambios de marca para que podamos actualizar los pares
                gridChanged = true;
            }
        }

        // actualizar la lista de pares solo si los pares cambiaron (es decir, un cuerpo cambió de región)
        if (gridChanged)
            grid.pairsList = _createActivePairsList(grid);
    };

    /**
     * Borra la cuadrícula.
     * @method clear -despejar
     * @param {grid} grid - cuadricula
     */
    Grid.clear = function(grid) {
        grid.buckets = {};
        grid.pairs = {};
        grid.pairsList = [];
    };

    /**
     * Encuentra la unión de dos regiones.
     * @method _regionUnion
     * @private
     * @param {} regionA 
     * @param {} regionB 
     * @return {} region - región
     */
    var _regionUnion = function(regionA, regionB) {
        var startCol = Math.min(regionA.startCol, regionB.startCol),
            endCol = Math.max(regionA.endCol, regionB.endCol),
            startRow = Math.min(regionA.startRow, regionB.startRow),
            endRow = Math.max(regionA.endRow, regionB.endRow);

        return _createRegion(startCol, endCol, startRow, endRow);
    };

    /**
     * Obtiene la región en la que cae un cuerpo determinado para una cuadrícula determinada.
     * @method _getRegion
     * @private
     * @param {} grid - cuadrícula
     * @param {} body - cuerpo
     * @return {} region - región
     */
    var _getRegion = function(grid, body) {
        var bounds = body.bounds,
            startCol = Math.floor(bounds.min.x / grid.bucketWidth),
            endCol = Math.floor(bounds.max.x / grid.bucketWidth),
            startRow = Math.floor(bounds.min.y / grid.bucketHeight),
            endRow = Math.floor(bounds.max.y / grid.bucketHeight);

        return _createRegion(startCol, endCol, startRow, endRow);
    };

    /**
     * Crea una región.
     * @method _createRegion
     * @private
     * @param {} startCol
     * @param {} endCol
     * @param {} startRow
     * @param {} endRow
     * @return {} region - región
     */
    var _createRegion = function(startCol, endCol, startRow, endRow) {
        return { 
            id: startCol + ',' + endCol + ',' + startRow + ',' + endRow,
            startCol: startCol, 
            endCol: endCol, 
            startRow: startRow, 
            endRow: endRow 
        };
    };

    /**
     * Obtiene la identificación de la agrupación en la posición dada.
     * @method _getBucketId
     * @private
     * @param {} column - columna
     * @param {} row - fila
     * @return {string} identificación de la agrupación
     */
    var _getBucketId = function(column, row) {
        return 'C' + column + 'R' + row;
    };

    /**
     * Crea una agrupación.
     * @method _createBucket
     * @private
     * @param {} buckets - agrupaciones
     * @param {} bucketId - identificación de la agrupación
     * @return {} bucket - agrupación
     */
    var _createBucket = function(buckets, bucketId) {
        var bucket = buckets[bucketId] = [];
        return bucket;
    };

    /**
     * Agrega un cuerpo a una agrupación.
     * @method _bucketAddBody
     * @private
     * @param {} grid - cuadrícula
     * @param {} bucket - agrupación
     * @param {} body - cuerpo
     */
    var _bucketAddBody = function(grid, bucket, body) {
        // agregar nuevos pares
        for (var i = 0; i < bucket.length; i++) {
            var bodyB = bucket[i];

            if (body.id === bodyB.id || (body.isStatic && bodyB.isStatic))
                continue;

            // realizar un seguimiento del número de agrupamientos en los que existe el par
            // importante para que Grid.update funcione
            var pairId = Pair.id(body, bodyB),
                pair = grid.pairs[pairId];

            if (pair) {
                pair[2] += 1;
            } else {
                grid.pairs[pairId] = [body, bodyB, 1];
            }
        }

        // agregar a los cuerpos (después de pares, de lo contrario se empareja con uno mismo)
        bucket.push(body);
    };

    /**
     * Saca un cuerpo de una agrupación.
     * @method _bucketRemoveBody
     * @private
     * @param {} grid - cuadrícula
     * @param {} bucket - agrupamiento
     * @param {} body - cuerpo
     */
    var _bucketRemoveBody = function(grid, bucket, body) {
        // retirar de la agrupación
        bucket.splice(Common.indexOf(bucket, body), 1);

        // actualizar recuentos de pares
        for (var i = 0; i < bucket.length; i++) {
            // realizar un seguimiento del número de agrupamientos en los que existe el par
            // importante para que _createActivePairsList funcione
            var bodyB = bucket[i],
                pairId = Pair.id(body, bodyB),
                pair = grid.pairs[pairId];

            if (pair)
                pair[2] -= 1;
        }
    };

    /**
     * Genera una lista de los pares activos en la cuadrícula.
     * @method _createActivePairsList
     * @private
     * @param {} grid - cuadricula
     * @return [] pairs - pares
     */
    var _createActivePairsList = function(grid) {
        var pairKeys,
            pair,
            pairs = [];

        // grid.pairs es usado como hashmap
        pairKeys = Common.keys(grid.pairs);

        // iterar sobre grid.pairs
        for (var k = 0; k < pairKeys.length; k++) {
            pair = grid.pairs[pairKeys[k]];

            // si existe un par en al menos una agrupación
            // es un par que necesita más pruebas de colisión, así que empújalo
            if (pair[2] > 0) {
                pairs.push(pair);
            } else {
                delete grid.pairs[pairKeys[k]];
            }
        }

        return pairs;
    };
    
})();

},{"../core/Common":14,"./Detector":5,"./Pair":7}],7:[function(_dereq_,module,exports){
/**
* El módulo `Matter.Pair` contiene métodos para crear y manipular pares de colisiones.
*
* @class Pair - Par
*/

var Pair = {};

module.exports = Pair;

var Contact = _dereq_('./Contact');

(function() {
    
    /**
     * Crea un par.
     * @method create - crear
     * @param {collision} collision - colisión 
     * @param {number} timestamp
     * @return {pair} Un nuevo par
     */
    Pair.create = function(collision, timestamp) {
        var bodyA = collision.bodyA,
            bodyB = collision.bodyB,
            parentA = collision.parentA,
            parentB = collision.parentB;

        var pair = {
            id: Pair.id(bodyA, bodyB),
            bodyA: bodyA,
            bodyB: bodyB,
            contacts: {},
            activeContacts: [],
            separation: 0,
            isActive: true,
            isSensor: bodyA.isSensor || bodyB.isSensor,
            timeCreated: timestamp,
            timeUpdated: timestamp,
            inverseMass: parentA.inverseMass + parentB.inverseMass,
            friction: Math.min(parentA.friction, parentB.friction),
            frictionStatic: Math.max(parentA.frictionStatic, parentB.frictionStatic),
            restitution: Math.max(parentA.restitution, parentB.restitution),
            slop: Math.max(parentA.slop, parentB.slop)
        };

        Pair.update(pair, collision, timestamp);

        return pair;
    };

    /**
     * Actualiza un par en caso de colisión.
     * @method update - actualización
     * @param {pair} pair - par
     * @param {collision} collision - collisión
     * @param {number} timestamp
     */
    Pair.update = function(pair, collision, timestamp) {
        var contacts = pair.contacts,
            supports = collision.supports,
            activeContacts = pair.activeContacts,
            parentA = collision.parentA,
            parentB = collision.parentB;
        
        pair.collision = collision;
        pair.inverseMass = parentA.inverseMass + parentB.inverseMass;
        pair.friction = Math.min(parentA.friction, parentB.friction);
        pair.frictionStatic = Math.max(parentA.frictionStatic, parentB.frictionStatic);
        pair.restitution = Math.max(parentA.restitution, parentB.restitution);
        pair.slop = Math.max(parentA.slop, parentB.slop);
        activeContacts.length = 0;
        
        if (collision.collided) {
            for (var i = 0; i < supports.length; i++) {
                var support = supports[i],
                    contactId = Contact.id(support),
                    contact = contacts[contactId];

                if (contact) {
                    activeContacts.push(contact);
                } else {
                    activeContacts.push(contacts[contactId] = Contact.create(support));
                }
            }

            pair.separation = collision.depth;
            Pair.setActive(pair, true, timestamp);
        } else {
            if (pair.isActive === true)
                Pair.setActive(pair, false, timestamp);
        }
    };
    
    /**
     * Configure un par como activo o inactivo.
     * @method setActive
     * @param {pair} pair - par
     * @param {bool} isActive 
     * @param {number} timestamp
     */
    Pair.setActive = function(pair, isActive, timestamp) {
        if (isActive) {
            pair.isActive = true;
            pair.timeUpdated = timestamp;
        } else {
            pair.isActive = false;
            pair.activeContacts.length = 0;
        }
    };

    /**
     * Obtenga la identificación del par dado.
     * @method id - identificación
     * @param {body} bodyA
     * @param {body} bodyB 
     * @return {string} Único pairId 
     */
    Pair.id = function(bodyA, bodyB) {
        if (bodyA.id < bodyB.id) {
            return 'A' + bodyA.id + 'B' + bodyB.id;
        } else {
            return 'A' + bodyB.id + 'B' + bodyA.id;
        }
    };

})();

},{"./Contact":4}],8:[function(_dereq_,module,exports){
/**
* El módulo `Matter.Pairs` contiene métodos para crear y manipular conjuntos de pares de colisiones.
*
* @class Pairs - Pares
*/

var Pairs = {};

module.exports = Pairs;

var Pair = _dereq_('./Pair');
var Common = _dereq_('../core/Common');

(function() {
    
    var _pairMaxIdleLife = 1000;

    /**
     * Crea una nueva estructura de pares.
     * @method create - crear
     * @param {object} options - opciones
     * @return {pairs} Una nueva estructura de pares
     */
    Pairs.create = function(options) {
        return Common.extend({ 
            table: {},
            list: [],
            collisionStart: [],
            collisionActive: [],
            collisionEnd: []
        }, options);
    };

    /**
     * Pares de actualizaciones dada una lista de colisiones.
     * @method update - actualización
     * @param {object} pairs - pares
     * @param {collision[]} collisions - colisiones
     * @param {number} timestamp
     */
    Pairs.update = function(pairs, collisions, timestamp) {
        var pairsList = pairs.list,
            pairsTable = pairs.table,
            collisionStart = pairs.collisionStart,
            collisionEnd = pairs.collisionEnd,
            collisionActive = pairs.collisionActive,
            activePairIds = [],
            collision,
            pairId,
            pair,
            i;

        // borrar matrices de estado de colisión, pero mantener la referencia anterior
        collisionStart.length = 0;
        collisionEnd.length = 0;
        collisionActive.length = 0;

        for (i = 0; i < collisions.length; i++) {
            collision = collisions[i];

            if (collision.collided) {
                pairId = Pair.id(collision.bodyA, collision.bodyB);
                activePairIds.push(pairId);

                pair = pairsTable[pairId];
                
                if (pair) {
                    // el par ya existe (pero puede estar activo o no)
                    if (pair.isActive) {
                        // par existe y está activo
                        collisionActive.push(pair);
                    } else {
                        // El par existe pero estaba inactivo, por lo que una colisión acaba de comenzar de nuevo.
                        collisionStart.push(pair);
                    }

                    // actualizar el par
                    Pair.update(pair, collision, timestamp);
                } else {
                    // par no existía, crea un nuevo par
                    pair = Pair.create(collision, timestamp);
                    pairsTable[pairId] = pair;

                    // presiona el nuevo par
                    collisionStart.push(pair);
                    pairsList.push(pair);
                }
            }
        }

        // desactivar pares previamente activos que ahora están inactivos
        for (i = 0; i < pairsList.length; i++) {
            pair = pairsList[i];
            if (pair.isActive && Common.indexOf(activePairIds, pair.id) === -1) {
                Pair.setActive(pair, false, timestamp);
                collisionEnd.push(pair);
            }
        }
    };
    
    /**
     * Busca y elimina pares que han estado inactivos durante un período de tiempo determinado.
     * @method removeOld
     * @param {object} pairs - pares
     * @param {number} timestamp
     */
    Pairs.removeOld = function(pairs, timestamp) {
        var pairsList = pairs.list,
            pairsTable = pairs.table,
            indexesToRemove = [],
            pair,
            collision,
            pairIndex,
            i;

        for (i = 0; i < pairsList.length; i++) {
            pair = pairsList[i];
            collision = pair.collision;
            
            // nunca quite los pares para dormir
            if (collision.bodyA.isSleeping || collision.bodyB.isSleeping) {
                pair.timeUpdated = timestamp;
                continue;
            }

            // si el par está inactivo durante demasiado tiempo, márquelo para eliminarlo
            if (timestamp - pair.timeUpdated > _pairMaxIdleLife) {
                indexesToRemove.push(i);
            }
        }

        // eliminar pares marcados
        for (i = 0; i < indexesToRemove.length; i++) {
            pairIndex = indexesToRemove[i] - i;
            pair = pairsList[pairIndex];
            delete pairsTable[pair.id];
            pairsList.splice(pairIndex, 1);
        }
    };

    /**
     * Borra la estructura de pares dada.
     * @method clear - claro
     * @param {pairs} pairs - pares
     * @return {pairs} pairs - pares
     */
    Pairs.clear = function(pairs) {
        pairs.table = {};
        pairs.list.length = 0;
        pairs.collisionStart.length = 0;
        pairs.collisionActive.length = 0;
        pairs.collisionEnd.length = 0;
        return pairs;
    };

})();

},{"../core/Common":14,"./Pair":7}],9:[function(_dereq_,module,exports){
/**
* El módulo `Matter.Query` contiene métodos para realizar consultas de colisión.
*
* Ve el uso incluido [ejemplos](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Query - consulta
*/

var Query = {};

module.exports = Query;

var Vector = _dereq_('../geometry/Vector');
var SAT = _dereq_('./SAT');
var Bounds = _dereq_('../geometry/Bounds');
var Bodies = _dereq_('../factory/Bodies');
var Vertices = _dereq_('../geometry/Vertices');

(function() {

    /**
     * Proyecta un segmento de rayo contra un conjunto de cuerpos y devuelve todas las colisiones; el ancho del rayo es opcional. No se proporcionan puntos de intersección.
     * @method ray - rayo
     * @param {body[]} bodies - cuerpos
     * @param {vector} startPoint 
     * @param {vector} endPoint
     * @param {number} [rayWidth]
     * @return {object[]} Collisions - colisiones
     */
    Query.ray = function(bodies, startPoint, endPoint, rayWidth) {
        rayWidth = rayWidth || 1e-100;

        var rayAngle = Vector.angle(startPoint, endPoint),
            rayLength = Vector.magnitude(Vector.sub(startPoint, endPoint)),
            rayX = (endPoint.x + startPoint.x) * 0.5,
            rayY = (endPoint.y + startPoint.y) * 0.5,
            ray = Bodies.rectangle(rayX, rayY, rayLength, rayWidth, { angle: rayAngle }),
            collisions = [];

        for (var i = 0; i < bodies.length; i++) {
            var bodyA = bodies[i];
            
            if (Bounds.overlaps(bodyA.bounds, ray.bounds)) {
                for (var j = bodyA.parts.length === 1 ? 0 : 1; j < bodyA.parts.length; j++) {
                    var part = bodyA.parts[j];

                    if (Bounds.overlaps(part.bounds, ray.bounds)) {
                        var collision = SAT.collides(part, ray);
                        if (collision.collided) {
                            collision.body = collision.bodyA = collision.bodyB = bodyA;
                            collisions.push(collision);
                            break;
                        }
                    }
                }
            }
        }

        return collisions;
    };

    /**
     * Devuelve todos los cuerpos cuyos límites están dentro (o fuera si están establecidos) del conjunto de límites dado, del conjunto de cuerpos dado.
     * @method region - región
     * @param {body[]} bodies - cuerpo
     * @param {bounds} bounds - límites
     * @param {bool} [outside=false]
     * @return {body[]} Los cuerpos que coinciden con la consulta
     */
    Query.region = function(bodies, bounds, outside) {
        var result = [];

        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i],
                overlaps = Bounds.overlaps(body.bounds, bounds);
            if ((overlaps && !outside) || (!overlaps && outside))
                result.push(body);
        }

        return result;
    };

    /**
     * Devuelve todos los cuerpos cuyos vértices contienen el punto dado, del conjunto de cuerpos dado.
     * @method point - punto
     * @param {body[]} bodies - cuerpos
     * @param {vector} point - punto
     * @return {body[]} Los cuerpos que coinciden con la consulta
     */
    Query.point = function(bodies, point) {
        var result = [];

        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];
            
            if (Bounds.contains(body.bounds, point)) {
                for (var j = body.parts.length === 1 ? 0 : 1; j < body.parts.length; j++) {
                    var part = body.parts[j];

                    if (Bounds.contains(part.bounds, point)
                        && Vertices.contains(part.vertices, point)) {
                        result.push(body);
                        break;
                    }
                }
            }
        }

        return result;
    };

})();

},{"../factory/Bodies":23,"../geometry/Bounds":26,"../geometry/Vector":28,"../geometry/Vertices":29,"./SAT":11}],10:[function(_dereq_,module,exports){
/**
* El módulo `Matter.Resolver` contiene métodos para resolver pares de colisiones.
*
* @class Resolver 
*/

var Resolver = {};

module.exports = Resolver;

var Vertices = _dereq_('../geometry/Vertices');
var Vector = _dereq_('../geometry/Vector');
var Common = _dereq_('../core/Common');
var Bounds = _dereq_('../geometry/Bounds');

(function() {

    Resolver._restingThresh = 4;
    Resolver._restingThreshTangent = 6;
    Resolver._positionDampen = 0.9;
    Resolver._positionWarming = 0.8;
    Resolver._frictionNormalMultiplier = 5;

    /**
     * Prepare parejas para resolver posiciones.
     * @method preSolvePosition
     * @param {pair[]} pairs - pares
     */
    Resolver.preSolvePosition = function(pairs) {
        var i,
            pair,
            activeCount;

        // encontrar contactos totales en cada cuerpo
        for (i = 0; i < pairs.length; i++) {
            pair = pairs[i];
            
            if (!pair.isActive)
                continue;
            
            activeCount = pair.activeContacts.length;
            pair.collision.parentA.totalContacts += activeCount;
            pair.collision.parentB.totalContacts += activeCount;
        }
    };

    /**
     * Encuentre una solución para las posiciones de los pares.
     * @method solvePosition
     * @param {pair[]} pairs - pares
     * @param {number} timeScale 
     */
    Resolver.solvePosition = function(pairs, timeScale) {
        var i,
            pair,
            collision,
            bodyA,
            bodyB,
            normal,
            bodyBtoA,
            contactShare,
            positionImpulse,
            contactCount = {},
            tempA = Vector._temp[0],
            tempB = Vector._temp[1],
            tempC = Vector._temp[2],
            tempD = Vector._temp[3];

        // encontrar los impulsos necesarios para resolver la penetración
        for (i = 0; i < pairs.length; i++) {
            pair = pairs[i];
            
            if (!pair.isActive || pair.isSensor)
                continue;

            collision = pair.collision;
            bodyA = collision.parentA;
            bodyB = collision.parentB;
            normal = collision.normal;

            // obtener la separación actual entre los bordes del cuerpo involucrados en la colisión
            bodyBtoA = Vector.sub(Vector.add(bodyB.positionImpulse, bodyB.position, tempA), 
                                    Vector.add(bodyA.positionImpulse, 
                                        Vector.sub(bodyB.position, collision.penetration, tempB), tempC), tempD);

            pair.separation = Vector.dot(normal, bodyBtoA);
        }
        
        for (i = 0; i < pairs.length; i++) {
            pair = pairs[i];

            if (!pair.isActive || pair.isSensor || pair.separation < 0)
                continue;
            
            collision = pair.collision;
            bodyA = collision.parentA;
            bodyB = collision.parentB;
            normal = collision.normal;
            positionImpulse = (pair.separation - pair.slop) * timeScale;

            if (bodyA.isStatic || bodyB.isStatic)
                positionImpulse *= 2;
            
            if (!(bodyA.isStatic || bodyA.isSleeping)) {
                contactShare = Resolver._positionDampen / bodyA.totalContacts;
                bodyA.positionImpulse.x += normal.x * positionImpulse * contactShare;
                bodyA.positionImpulse.y += normal.y * positionImpulse * contactShare;
            }

            if (!(bodyB.isStatic || bodyB.isSleeping)) {
                contactShare = Resolver._positionDampen / bodyB.totalContacts;
                bodyB.positionImpulse.x -= normal.x * positionImpulse * contactShare;
                bodyB.positionImpulse.y -= normal.y * positionImpulse * contactShare;
            }
        }
    };

    /**
     * Aplicar resolución de posición.
     * @method postSolvePosition
     * @param {body[]} bodies - cuerpos
     */
    Resolver.postSolvePosition = function(bodies) {
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];

            // restablecer el recuento de contactos
            body.totalContacts = 0;

            if (body.positionImpulse.x !== 0 || body.positionImpulse.y !== 0) {
                // actualizar la geometría del cuerpo
                for (var j = 0; j < body.parts.length; j++) {
                    var part = body.parts[j];
                    Vertices.translate(part.vertices, body.positionImpulse);
                    Bounds.update(part.bounds, part.vertices, body.velocity);
                    part.position.x += body.positionImpulse.x;
                    part.position.y += body.positionImpulse.y;
                }

                // mueve el cuerpo sin cambiar la velocidad
                body.positionPrev.x += body.positionImpulse.x;
                body.positionPrev.y += body.positionImpulse.y;

                if (Vector.dot(body.positionImpulse, body.velocity) < 0) {
                    // restablecer el impulso en caché si el cuerpo tiene velocidad a lo largo de él
                    body.positionImpulse.x = 0;
                    body.positionImpulse.y = 0;
                } else {
                    // calentar la próxima iteración
                    body.positionImpulse.x *= Resolver._positionWarming;
                    body.positionImpulse.y *= Resolver._positionWarming;
                }
            }
        }
    };

    /**
     * Prepare parejas para resolver velocidades.
     * @method preSolveVelocity
     * @param {pair[]} pairs - pares
     */
    Resolver.preSolveVelocity = function(pairs) {
        var i,
            j,
            pair,
            contacts,
            collision,
            bodyA,
            bodyB,
            normal,
            tangent,
            contact,
            contactVertex,
            normalImpulse,
            tangentImpulse,
            offset,
            impulse = Vector._temp[0],
            tempA = Vector._temp[1];
        
        for (i = 0; i < pairs.length; i++) {
            pair = pairs[i];
            
            if (!pair.isActive || pair.isSensor)
                continue;
            
            contacts = pair.activeContacts;
            collision = pair.collision;
            bodyA = collision.parentA;
            bodyB = collision.parentB;
            normal = collision.normal;
            tangent = collision.tangent;

            // resolver cada contacto
            for (j = 0; j < contacts.length; j++) {
                contact = contacts[j];
                contactVertex = contact.vertex;
                normalImpulse = contact.normalImpulse;
                tangentImpulse = contact.tangentImpulse;

                if (normalImpulse !== 0 || tangentImpulse !== 0) {
                    // impulso total de contacto
                    impulse.x = (normal.x * normalImpulse) + (tangent.x * tangentImpulse);
                    impulse.y = (normal.y * normalImpulse) + (tangent.y * tangentImpulse);
                    
                    // aplicar el impulso del contacto
                    if (!(bodyA.isStatic || bodyA.isSleeping)) {
                        offset = Vector.sub(contactVertex, bodyA.position, tempA);
                        bodyA.positionPrev.x += impulse.x * bodyA.inverseMass;
                        bodyA.positionPrev.y += impulse.y * bodyA.inverseMass;
                        bodyA.anglePrev += Vector.cross(offset, impulse) * bodyA.inverseInertia;
                    }

                    if (!(bodyB.isStatic || bodyB.isSleeping)) {
                        offset = Vector.sub(contactVertex, bodyB.position, tempA);
                        bodyB.positionPrev.x -= impulse.x * bodyB.inverseMass;
                        bodyB.positionPrev.y -= impulse.y * bodyB.inverseMass;
                        bodyB.anglePrev -= Vector.cross(offset, impulse) * bodyB.inverseInertia;
                    }
                }
            }
        }
    };

    /**
     * Encuentre una solución para las velocidades de los pares.
     * @method solveVelocity 		
     * @param {pair[]} pairs - pares
     * @param {number} timeScale 
     */
    Resolver.solveVelocity = function(pairs, timeScale) {
        var timeScaleSquared = timeScale * timeScale,
            impulse = Vector._temp[0],
            tempA = Vector._temp[1],
            tempB = Vector._temp[2],
            tempC = Vector._temp[3],
            tempD = Vector._temp[4],
            tempE = Vector._temp[5];
        
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i];
            
            if (!pair.isActive || pair.isSensor)
                continue;
            
            var collision = pair.collision,
                bodyA = collision.parentA,
                bodyB = collision.parentB,
                normal = collision.normal,
                tangent = collision.tangent,
                contacts = pair.activeContacts,
                contactShare = 1 / contacts.length;

            // actualizar las velocidades de los cuerpos
            bodyA.velocity.x = bodyA.position.x - bodyA.positionPrev.x;
            bodyA.velocity.y = bodyA.position.y - bodyA.positionPrev.y;
            bodyB.velocity.x = bodyB.position.x - bodyB.positionPrev.x;
            bodyB.velocity.y = bodyB.position.y - bodyB.positionPrev.y;
            bodyA.angularVelocity = bodyA.angle - bodyA.anglePrev;
            bodyB.angularVelocity = bodyB.angle - bodyB.anglePrev;

            // resolver cada contacto
            for (var j = 0; j < contacts.length; j++) {
                var contact = contacts[j],
                    contactVertex = contact.vertex,
                    offsetA = Vector.sub(contactVertex, bodyA.position, tempA),
                    offsetB = Vector.sub(contactVertex, bodyB.position, tempB),
                    velocityPointA = Vector.add(bodyA.velocity, Vector.mult(Vector.perp(offsetA), bodyA.angularVelocity), tempC),
                    velocityPointB = Vector.add(bodyB.velocity, Vector.mult(Vector.perp(offsetB), bodyB.angularVelocity), tempD), 
                    relativeVelocity = Vector.sub(velocityPointA, velocityPointB, tempE),
                    normalVelocity = Vector.dot(normal, relativeVelocity);

                var tangentVelocity = Vector.dot(tangent, relativeVelocity),
                    tangentSpeed = Math.abs(tangentVelocity),
                    tangentVelocityDirection = Common.sign(tangentVelocity);

                // impulsos en bruto
                var normalImpulse = (1 + pair.restitution) * normalVelocity,
                    normalForce = Common.clamp(pair.separation + normalVelocity, 0, 1) * Resolver._frictionNormalMultiplier;

                // fricción de coulomb
                var tangentImpulse = tangentVelocity,
                    maxFriction = Infinity;

                if (tangentSpeed > pair.friction * pair.frictionStatic * normalForce * timeScaleSquared) {
                    maxFriction = tangentSpeed;
                    tangentImpulse = Common.clamp(
                        pair.friction * tangentVelocityDirection * timeScaleSquared,
                        -maxFriction, maxFriction
                    );
                }

                // modificar los impulsos teniendo en cuenta la masa, la inercia y la compensación
                var oAcN = Vector.cross(offsetA, normal),
                    oBcN = Vector.cross(offsetB, normal),
                    share = contactShare / (bodyA.inverseMass + bodyB.inverseMass + bodyA.inverseInertia * oAcN * oAcN  + bodyB.inverseInertia * oBcN * oBcN);

                normalImpulse *= share;
                tangentImpulse *= share;

                // manejar las colisiones de alta velocidad y en reposo por separado
                if (normalVelocity < 0 && normalVelocity * normalVelocity > Resolver._restingThresh * timeScaleSquared) {
                    // alta velocidad normal, por lo tanto, borre el impulso normal de contacto en caché
                    contact.normalImpulse = 0;
                } else {
                    // resolver las restricciones de colisión en reposo utilizando el método de Erin Catto (GDC08)
                    // la restricción de impulso tiende a 0
                    var contactNormalImpulse = contact.normalImpulse;
                    contact.normalImpulse = Math.min(contact.normalImpulse + normalImpulse, 0);
                    normalImpulse = contact.normalImpulse - contactNormalImpulse;
                }

                // manejar las colisiones de alta velocidad y en reposo por separado
                if (tangentVelocity * tangentVelocity > Resolver._restingThreshTangent * timeScaleSquared) {
                    // alta velocidad tangente, por lo tanto, borre el impulso tangente de contacto en caché
                    contact.tangentImpulse = 0;
                } else {
                    // resolver las restricciones de colisión en reposo utilizando el método de Erin Catto (GDC08)
                    // impulso tangente tiende a -tangentSpeed ​​o + tangentSpeed
                    var contactTangentImpulse = contact.tangentImpulse;
                    contact.tangentImpulse = Common.clamp(contact.tangentImpulse + tangentImpulse, -maxFriction, maxFriction);
                    tangentImpulse = contact.tangentImpulse - contactTangentImpulse;
                }

                // impulso total de contacto
                impulse.x = (normal.x * normalImpulse) + (tangent.x * tangentImpulse);
                impulse.y = (normal.y * normalImpulse) + (tangent.y * tangentImpulse);
                
                // aplicar el impulso del contacto
                if (!(bodyA.isStatic || bodyA.isSleeping)) {
                    bodyA.positionPrev.x += impulse.x * bodyA.inverseMass;
                    bodyA.positionPrev.y += impulse.y * bodyA.inverseMass;
                    bodyA.anglePrev += Vector.cross(offsetA, impulse) * bodyA.inverseInertia;
                }

                if (!(bodyB.isStatic || bodyB.isSleeping)) {
                    bodyB.positionPrev.x -= impulse.x * bodyB.inverseMass;
                    bodyB.positionPrev.y -= impulse.y * bodyB.inverseMass;
                    bodyB.anglePrev -= Vector.cross(offsetB, impulse) * bodyB.inverseInertia;
                }
            }
        }
    };

})();

},{"../core/Common":14,"../geometry/Bounds":26,"../geometry/Vector":28,"../geometry/Vertices":29}],11:[function(_dereq_,module,exports){
/**
* El módulo `Matter.SAT` contiene métodos para detectar colisiones usando el teorema del eje de separación.
*
* @class SAT
*/

// TODO: circulos y curvas verdaderas

var SAT = {};

module.exports = SAT;

var Vertices = _dereq_('../geometry/Vertices');
var Vector = _dereq_('../geometry/Vector');

(function() {

    /**
     * Detecta la colisión entre dos cuerpos usando el teorema del eje de separación.
     * @method collides - colisiona
     * @param {body} bodyA 
     * @param {body} bodyB 
     * @param {collision} previousCollision
     * @return {collision} collision - colisión
     */
    SAT.collides = function(bodyA, bodyB, previousCollision) {
        var overlapAB,
            overlapBA, 
            minOverlap,
            collision,
            canReusePrevCol = false;

        if (previousCollision) {
            // estimar el movimiento total
            var parentA = bodyA.parent,
                parentB = bodyB.parent,
                motion = parentA.speed * parentA.speed + parentA.angularSpeed * parentA.angularSpeed
                       + parentB.speed * parentB.speed + parentB.angularSpeed * parentB.angularSpeed;

            // es posible que podamos reutilizar (parcialmente) el resultado de la colisión 
            // pero solo es seguro si la colisión estaba descansando.
            canReusePrevCol = previousCollision && previousCollision.collided && motion < 0.2;

            // reutilizar objeto de colisión
            collision = previousCollision;
        } else {
            collision = { collided: false, bodyA: bodyA, bodyB: bodyB };
        }

        if (previousCollision && canReusePrevCol) {
            // si podemos reutilizar el resultado de la colisión
            // solo necesitamos probar el eje previamente encontrado
            var axisBodyA = collision.axisBody,
                axisBodyB = axisBodyA === bodyA ? bodyB : bodyA,
                axes = [axisBodyA.axes[previousCollision.axisNumber]];

            minOverlap = _overlapAxes(axisBodyA.vertices, axisBodyB.vertices, axes);
            collision.reused = true;

            if (minOverlap.overlap <= 0) {
                collision.collided = false;
                return collision;
            }
        } else {
            // si no podemos reutilizar un resultado, realice una prueba SAT completa

            overlapAB = _overlapAxes(bodyA.vertices, bodyB.vertices, bodyA.axes);

            if (overlapAB.overlap <= 0) {
                collision.collided = false;
                return collision;
            }

            overlapBA = _overlapAxes(bodyB.vertices, bodyA.vertices, bodyB.axes);

            if (overlapBA.overlap <= 0) {
                collision.collided = false;
                return collision;
            }

            if (overlapAB.overlap < overlapBA.overlap) {
                minOverlap = overlapAB;
                collision.axisBody = bodyA;
            } else {
                minOverlap = overlapBA;
                collision.axisBody = bodyB;
            }

            // importante para reutilizar más tarde
            collision.axisNumber = minOverlap.axisNumber;
        }

        collision.bodyA = bodyA.id < bodyB.id ? bodyA : bodyB;
        collision.bodyB = bodyA.id < bodyB.id ? bodyB : bodyA;
        collision.collided = true;
        collision.depth = minOverlap.overlap;
        collision.parentA = collision.bodyA.parent;
        collision.parentB = collision.bodyB.parent;
        
        bodyA = collision.bodyA;
        bodyB = collision.bodyB;

        // asegúrese de que lo normal esté de espaldas al cuerpoA
        if (Vector.dot(minOverlap.axis, Vector.sub(bodyB.position, bodyA.position)) < 0) {
            collision.normal = {
                x: minOverlap.axis.x,
                y: minOverlap.axis.y
            };
        } else {
            collision.normal = {
                x: -minOverlap.axis.x,
                y: -minOverlap.axis.y
            };
        }

        collision.tangent = Vector.perp(collision.normal);

        collision.penetration = collision.penetration || {};
        collision.penetration.x = collision.normal.x * collision.depth;
        collision.penetration.y = collision.normal.y * collision.depth; 

        // encontre puntos de apoyo, siempre hay exactamente uno o dos
        var verticesB = _findSupports(bodyA, bodyB, collision.normal),
            supports = [];

        // encontre los soportes de bodyB que están dentro de bodyA
        if (Vertices.contains(bodyA.vertices, verticesB[0]))
            supports.push(verticesB[0]);

        if (Vertices.contains(bodyA.vertices, verticesB[1]))
            supports.push(verticesB[1]);

        // encontre los soportes del bodyA que están dentro del bodyB
        if (supports.length < 2) {
            var verticesA = _findSupports(bodyB, bodyA, Vector.neg(collision.normal));
                
            if (Vertices.contains(bodyB.vertices, verticesA[0]))
                supports.push(verticesA[0]);

            if (supports.length < 2 && Vertices.contains(bodyB.vertices, verticesA[1]))
                supports.push(verticesA[1]);
        }

        // ten en cuenta el caso límite de superposición pero sin contención de vértices
        if (supports.length < 1)
            supports = [verticesB[0]];
        
        collision.supports = supports;

        return collision;
    };

    /**
     * Encuentra la superposición entre dos conjuntos de vértices.
     * @method _overlapAxes
     * @private
     * @param {} verticesA 
     * @param {} verticesB 
     * @param {} axes - ejes
     * @return result - resultado
     */
    var _overlapAxes = function(verticesA, verticesB, axes) {
        var projectionA = Vector._temp[0], 
            projectionB = Vector._temp[1],
            result = { overlap: Number.MAX_VALUE },
            overlap,
            axis;

        for (var i = 0; i < axes.length; i++) {
            axis = axes[i];

            _projectToAxis(projectionA, verticesA, axis);
            _projectToAxis(projectionB, verticesB, axis);

            overlap = Math.min(projectionA.max - projectionB.min, projectionB.max - projectionA.min);

            if (overlap <= 0) {
                result.overlap = overlap;
                return result;
            }

            if (overlap < result.overlap) {
                result.overlap = overlap;
                result.axis = axis;
                result.axisNumber = i;
            }
        }

        return result;
    };

    /**
     * Proyecta vértices en un eje y devuelve un intervalo.
     * @method _projectToAxis
     * @private
     * @param {} projection - proyección
     * @param {} vertices - vértices
     * @param {} axis - ejes
     */
    var _projectToAxis = function(projection, vertices, axis) {
        var min = Vector.dot(vertices[0], axis),
            max = min;

        for (var i = 1; i < vertices.length; i += 1) {
            var dot = Vector.dot(vertices[i], axis);

            if (dot > max) { 
                max = dot; 
            } else if (dot < min) { 
                min = dot; 
            }
        }

        projection.min = min;
        projection.max = max;
    };
    
    /**
     * Encuentra vértices de soporte dados dos cuerpos a lo largo de una dirección dada usando escalada.
     * @method _findSupports
     * @private
     * @param {} bodyA 
     * @param {} bodyB 
     * @param {} normal - normal
     * @return [vector]
     */
    var _findSupports = function(bodyA, bodyB, normal) {
        var nearestDistance = Number.MAX_VALUE,
            vertexToBody = Vector._temp[0],
            vertices = bodyB.vertices,
            bodyAPosition = bodyA.position,
            distance,
            vertex,
            vertexA,
            vertexB;

        // encontrar el vértice más cercano en bodyB
        for (var i = 0; i < vertices.length; i++) {
            vertex = vertices[i];
            vertexToBody.x = vertex.x - bodyAPosition.x;
            vertexToBody.y = vertex.y - bodyAPosition.y;
            distance = -Vector.dot(normal, vertexToBody);

            if (distance < nearestDistance) {
                nearestDistance = distance;
                vertexA = vertex;
            }
        }

        // encuentra el siguiente vértice más cercano usando los dos conectados a él
        var prevIndex = vertexA.index - 1 >= 0 ? vertexA.index - 1 : vertices.length - 1;
        vertex = vertices[prevIndex];
        vertexToBody.x = vertex.x - bodyAPosition.x;
        vertexToBody.y = vertex.y - bodyAPosition.y;
        nearestDistance = -Vector.dot(normal, vertexToBody);
        vertexB = vertex;

        var nextIndex = (vertexA.index + 1) % vertices.length;
        vertex = vertices[nextIndex];
        vertexToBody.x = vertex.x - bodyAPosition.x;
        vertexToBody.y = vertex.y - bodyAPosition.y;
        distance = -Vector.dot(normal, vertexToBody);
        if (distance < nearestDistance) {
            vertexB = vertex;
        }

        return [vertexA, vertexB];
    };

})();

},{"../geometry/Vector":28,"../geometry/Vertices":29}],12:[function(_dereq_,module,exports){
/**
* El módulo `Matter.Constraint` contiene métodos para crear y manipular restricciones.
* Las restricciones se utilizan para especificar que se debe mantener una distancia fija entre dos cuerpos (o un cuerpo y una posición fija en el espacio del mundo).
* La rigidez de las restricciones se puede modificar para crear resortes o elásticos.
*
* Ve el uso incluido [ejemplos](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Constraint - Restricción
*/

// TODO: arregla los problemas de inestabilidad con torque
// TODO: restricciones vinculadas
// TODO: restricciones rompibles
// TODO: restricciones de colisión
// TODO: permitir que los cuerpos con restricciones duerman
// TODO: manejar correctamente las restricciones de longitud 0
// TODO: almacenamiento en caché y calentamiento de impulsos

var Constraint = {};

module.exports = Constraint;

var Vertices = _dereq_('../geometry/Vertices');
var Vector = _dereq_('../geometry/Vector');
var Sleeping = _dereq_('../core/Sleeping');
var Bounds = _dereq_('../geometry/Bounds');
var Axes = _dereq_('../geometry/Axes');
var Common = _dereq_('../core/Common');

(function() {

    var _minLength = 0.000001,
        _minDifference = 0.001;

    /**
     * Crea una nueva restricción.
     * Todas las propiedades tienen valores predeterminados y muchas se precalculan automáticamente en función de otras propiedades.
     * Consulte la sección de propiedades a continuación para obtener información detallada sobre lo que puede pasar a través del objeto `options`.
     * @method create - crear
     * @param {} options - opciones
     * @return {constraint} constraint - restricción
     */
    Constraint.create = function(options) {
        var constraint = options;

        // si los cuerpos están definidos pero no hay puntos, use el centro del cuerpo
        if (constraint.bodyA && !constraint.pointA)
            constraint.pointA = { x: 0, y: 0 };
        if (constraint.bodyB && !constraint.pointB)
            constraint.pointB = { x: 0, y: 0 };

        // calcula la longitud estática utilizando puntos del espacio mundo iniciales
        var initialPointA = constraint.bodyA ? Vector.add(constraint.bodyA.position, constraint.pointA) : constraint.pointA,
            initialPointB = constraint.bodyB ? Vector.add(constraint.bodyB.position, constraint.pointB) : constraint.pointB,
            length = Vector.magnitude(Vector.sub(initialPointA, initialPointB));
    
        constraint.length = constraint.length || length || _minLength;

        // renderizar
        var render = {
            visible: true,
            lineWidth: 2,
            strokeStyle: '#ffffff'
        };
        
        constraint.render = Common.extend(render, constraint.render);

        // opciones predeterminadas
        constraint.id = constraint.id || Common.nextId();
        constraint.label = constraint.label || 'Constraint';
        constraint.type = 'constraint';
        constraint.stiffness = constraint.stiffness || 1;
        constraint.angularStiffness = constraint.angularStiffness || 0;
        constraint.angleA = constraint.bodyA ? constraint.bodyA.angle : constraint.angleA;
        constraint.angleB = constraint.bodyB ? constraint.bodyB.angle : constraint.angleB;
        constraint.plugin = {};

        return constraint;
    };

    /**
     * Resuelve todas las restricciones en una lista de colisiones.
     * @private
     * @method solveAll - resuleveTodas
     * @param {constraint[]} constraints - restricciones
     * @param {number} timeScale 
     */
    Constraint.solveAll = function(constraints, timeScale) {
        for (var i = 0; i < constraints.length; i++) {
            Constraint.solve(constraints[i], timeScale);
        }
    };

    /**
     * Resuelve una restricción de distancia con el método de Gauss-Seidel.
     * @private
     * @method solve - resolver
     * @param {constraint} constraint - restricción
     * @param {number} timeScale 
     */
    Constraint.solve = function(constraint, timeScale) {
        var bodyA = constraint.bodyA,
            bodyB = constraint.bodyB,
            pointA = constraint.pointA,
            pointB = constraint.pointB;

        // actualizar el ángulo de referencia
        if (bodyA && !bodyA.isStatic) {
            constraint.pointA = Vector.rotate(pointA, bodyA.angle - constraint.angleA);
            constraint.angleA = bodyA.angle;
        }
        
        // actualizar el ángulo de referencia
        if (bodyB && !bodyB.isStatic) {
            constraint.pointB = Vector.rotate(pointB, bodyB.angle - constraint.angleB);
            constraint.angleB = bodyB.angle;
        }

        var pointAWorld = pointA,
            pointBWorld = pointB;

        if (bodyA) pointAWorld = Vector.add(bodyA.position, pointA);
        if (bodyB) pointBWorld = Vector.add(bodyB.position, pointB);

        if (!pointAWorld || !pointBWorld)
            return;

        var delta = Vector.sub(pointAWorld, pointBWorld),
            currentLength = Vector.magnitude(delta);

        // prevé la singularidad
        if (currentLength === 0)
            currentLength = _minLength;

        // resuelve la restricción de distancia con el método de Gauss-Seidel
        var difference = (currentLength - constraint.length) / currentLength,
            normal = Vector.div(delta, currentLength),
            force = Vector.mult(delta, difference * 0.5 * constraint.stiffness * timeScale * timeScale);
        
        // si la diferencia es muy pequeña, podemos omitir
        if (Math.abs(1 - (currentLength / constraint.length)) < _minDifference * timeScale)
            return;

        var velocityPointA,
            velocityPointB,
            offsetA,
            offsetB,
            oAn,
            oBn,
            bodyADenom,
            bodyBDenom;
    
        if (bodyA && !bodyA.isStatic) {
            // point body offset
            offsetA = { 
                x: pointAWorld.x - bodyA.position.x + force.x, 
                y: pointAWorld.y - bodyA.position.y + force.y
            };
            
            // velocidad actualizada
            bodyA.velocity.x = bodyA.position.x - bodyA.positionPrev.x;
            bodyA.velocity.y = bodyA.position.y - bodyA.positionPrev.y;
            bodyA.angularVelocity = bodyA.angle - bodyA.anglePrev;
            
            // encontrar la velocidad puntual y la masa corporal
            velocityPointA = Vector.add(bodyA.velocity, Vector.mult(Vector.perp(offsetA), bodyA.angularVelocity));
            oAn = Vector.dot(offsetA, normal);
            bodyADenom = bodyA.inverseMass + bodyA.inverseInertia * oAn * oAn;
        } else {
            velocityPointA = { x: 0, y: 0 };
            bodyADenom = bodyA ? bodyA.inverseMass : 0;
        }
            
        if (bodyB && !bodyB.isStatic) {
            // desplazamiento del cuerpo del punto
            offsetB = { 
                x: pointBWorld.x - bodyB.position.x - force.x, 
                y: pointBWorld.y - bodyB.position.y - force.y 
            };
            
            // velocidad actualizada
            bodyB.velocity.x = bodyB.position.x - bodyB.positionPrev.x;
            bodyB.velocity.y = bodyB.position.y - bodyB.positionPrev.y;
            bodyB.angularVelocity = bodyB.angle - bodyB.anglePrev;

            // encontrar la velocidad puntual y la masa corporal
            velocityPointB = Vector.add(bodyB.velocity, Vector.mult(Vector.perp(offsetB), bodyB.angularVelocity));
            oBn = Vector.dot(offsetB, normal);
            bodyBDenom = bodyB.inverseMass + bodyB.inverseInertia * oBn * oBn;
        } else {
            velocityPointB = { x: 0, y: 0 };
            bodyBDenom = bodyB ? bodyB.inverseMass : 0;
        }
        
        var relativeVelocity = Vector.sub(velocityPointB, velocityPointA),
            normalImpulse = Vector.dot(normal, relativeVelocity) / (bodyADenom + bodyBDenom);
    
        if (normalImpulse > 0) normalImpulse = 0;
    
        var normalVelocity = {
            x: normal.x * normalImpulse, 
            y: normal.y * normalImpulse
        };

        var torque;
 
        if (bodyA && !bodyA.isStatic) {
            torque = Vector.cross(offsetA, normalVelocity) * bodyA.inverseInertia * (1 - constraint.angularStiffness);

            // realiza un seguimiento de los impulsos aplicados para la resolución posterior
            bodyA.constraintImpulse.x -= force.x;
            bodyA.constraintImpulse.y -= force.y;
            bodyA.constraintImpulse.angle += torque;

            // aplicar fuerzas
            bodyA.position.x -= force.x;
            bodyA.position.y -= force.y;
            bodyA.angle += torque;
        }

        if (bodyB && !bodyB.isStatic) {
            torque = Vector.cross(offsetB, normalVelocity) * bodyB.inverseInertia * (1 - constraint.angularStiffness);

            // realiza un seguimiento de los impulsos aplicados para la resolución posterior
            bodyB.constraintImpulse.x += force.x;
            bodyB.constraintImpulse.y += force.y;
            bodyB.constraintImpulse.angle -= torque;
            
            // aplicar fuerzas
            bodyB.position.x += force.x;
            bodyB.position.y += force.y;
            bodyB.angle -= torque;
        }

    };

    /**
     * Realiza las actualizaciones corporales necesarias después de resolver las limitaciones.
     * @private
     * @method postSolveAll 
     * @param {body[]} bodies - cuerpos
     */
    Constraint.postSolveAll = function(bodies) {
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i],
                impulse = body.constraintImpulse;

            if (impulse.x === 0 && impulse.y === 0 && impulse.angle === 0) {
                continue;
            }

            Sleeping.set(body, false);

            // actualiza la geometría y restablece
            for (var j = 0; j < body.parts.length; j++) {
                var part = body.parts[j];
                
                Vertices.translate(part.vertices, impulse);

                if (j > 0) {
                    part.position.x += impulse.x;
                    part.position.y += impulse.y;
                }

                if (impulse.angle !== 0) {
                    Vertices.rotate(part.vertices, impulse.angle, body.position);
                    Axes.rotate(part.axes, impulse.angle);
                    if (j > 0) {
                        Vector.rotateAbout(part.position, impulse.angle, body.position, part.position);
                    }
                }

                Bounds.update(part.bounds, part.vertices, body.velocity);
            }

            impulse.angle = 0;
            impulse.x = 0;
            impulse.y = 0;
        }
    };

    /*
    *
    *  Documentación de propiedades
    *
    */

    /**
     * Un `Número` entero de identificación única generado en`Composite.create` por `Common.nextId`.
     *
     * @property id - identifiación
     * @type number - número
     */

    /**
     * Una `Cadena` que indica el tipo de objeto.
     *
     * @property type - tipo
     * @type string - cadena
     * @default "constraint" - "restricción"
     * @readOnly
     */

    /**
     * Un nombre de `Cadena` arbitrario para ayudar al usuario a identificar y administrar los cuerpos.
     *
     * @property label - etiqueta
     * @type string - cadena
     * @default "Constraint" "Restricción"
     */

    /**
     * Un `Object` que define las propiedades de renderizado que consumirá el módulo `Matter.Render`.
     *
     * @property render -renderizar
     * @type object - objeto 
     */

    /**
     * Una marca que indica si se debe representar la restricción.
     *
     * @property render.visible
     * @type boolean
     * @default true - verdadero
     */

    /**
     * Un `Número` que define el ancho de línea que se utilizará al representar el contorno de la restricción.
     * Un valor de "0" significa que no se representará ningún contorno.
     *
     * @property render.lineWidth
     * @type number - número
     * @default 2
     */

    /**
     * Una `Cadena` que define el estilo de trazo que se utilizará al representar el contorno de la restricción.
     * Es lo mismo que cuando se usa un lienzo, por lo que acepta valores de propiedad de estilo CSS.
     *
     * @property render.strokeStyle
     * @type string - cadena
     * @default un color al azar
     */

    /**
     * El primer `Cuerpo` posible al que se adjunta esta restricción.
     *
     * @property bodyA 
     * @type body - cuerpo
     * @default null - nulo 
     */

    /**
     * El segundo `Cuerpo` posible al que se adjunta esta restricción.
     *
     * @property bodyB 
     * @type body - cuerpo
     * @default null - nulo
     */

    /**
     * Un `Vector` que especifica el desplazamiento de la restricción desde el centro de la `constraint.bodyA` si está definida, de lo contrario una posición en el espacio del mundo.
     *
     * @property pointA - puntoA
     * @type vector - vector
     * @default { x: 0, y: 0 }
     */

    /**
     * Un `Vector` que especifica el desplazamiento de la restricción desde el centro de la `constraint.bodyA` si está definida, de lo contrario una posición en el espacio del mundo.
     *
     * @property pointB
     * @type vector - vector
     * @default { x: 0, y: 0 }
     */

    /**
     * Un `Número` que especifica la rigidez de la restricción, es decir, la velocidad a la que vuelve a su `constraint.length` en reposo.
     * Un valor de `1` significa que la restricción debe ser muy rígida.
     * Un valor de `0.2` significa que la restricción actúa como un resorte blando.
     *
     * @property stiffness
     * @type number - número
     * @default 1
     */

    /**
     * Un `Número` que especifica la longitud de reposo objetivo de la restricción. 
     * Se calcula automáticamente en `Constraint.create` a partir de las posiciones iniciales de` constraint.bodyA` y `constraint.bodyB`.
     *
     * @property length - largo
     * @type number - número
     */

    /**
     * Un objeto reservado para almacenar propiedades específicas del complemento.
     *
     * @property plugin - conectar
     * @type {}
     */

})();

},{"../core/Common":14,"../core/Sleeping":22,"../geometry/Axes":25,"../geometry/Bounds":26,"../geometry/Vector":28,"../geometry/Vertices":29}],13:[function(_dereq_,module,exports){
/**
* El módulo `Matter.MouseConstraint` contiene métodos para crear restricciones del ratón.
* Las restricciones del ratón se utilizan para permitir la interacción del usuario, proporcionando la capacidad de mover cuerpos mediante el ratón o el tacto.
*
* Ve el uso incluido [ejemplos](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class MouseConstraint 
*/

var MouseConstraint = {};

module.exports = MouseConstraint;

var Vertices = _dereq_('../geometry/Vertices');
var Sleeping = _dereq_('../core/Sleeping');
var Mouse = _dereq_('../core/Mouse');
var Events = _dereq_('../core/Events');
var Detector = _dereq_('../collision/Detector');
var Constraint = _dereq_('./Constraint');
var Composite = _dereq_('../body/Composite');
var Common = _dereq_('../core/Common');
var Bounds = _dereq_('../geometry/Bounds');

(function() {

    /**
     * Crea una nueva restricción del ratón.
     * Todas las propiedades tienen valores predeterminados y muchas se precalculan automáticamente en función de otras propiedades.
     * Consulte la sección de propiedades a continuación para obtener información detallada sobre lo que puede pasar a través del objeto `options`.
     * @method create - crear
     * @param {engine} engine - motor
     * @param {} options - opciones
     * @return {MouseConstraint} Una nueva MouseConstraint
     */
    MouseConstraint.create = function(engine, options) {
        var mouse = (engine ? engine.mouse : null) || (options ? options.mouse : null);

        if (!mouse) {
            if (engine && engine.render && engine.render.canvas) {
                mouse = Mouse.create(engine.render.canvas);
            } else if (options && options.element) {
                mouse = Mouse.create(options.element);
            } else {
                mouse = Mouse.create();
                Common.warn('MouseConstraint.create: options.mouse was undefined, options.element was undefined, may not function as expected');
            }
        }

        var constraint = Constraint.create({ 
            label: 'Mouse Constraint',
            pointA: mouse.position,
            pointB: { x: 0, y: 0 },
            length: 0.01, 
            stiffness: 0.1,
            angularStiffness: 1,
            render: {
                strokeStyle: '#90EE90',
                lineWidth: 3
            }
        });

        var defaults = {
            type: 'mouseConstraint',
            mouse: mouse,
            element: null,
            body: null,
            constraint: constraint,
            collisionFilter: {
                category: 0x0001,
                mask: 0xFFFFFFFF,
                group: 0
            }
        };

        var mouseConstraint = Common.extend(defaults, options);

        Events.on(engine, 'beforeUpdate', function() {
            var allBodies = Composite.allBodies(engine.world);
            MouseConstraint.update(mouseConstraint, allBodies);
            _triggerEvents(mouseConstraint);
        });

        return mouseConstraint;
    };

    /**
     * Actualiza la restricción del ratón dada.
     * @private
     * @method update - actualización
     * @param {MouseConstraint} mouseConstraint 
     * @param {body[]} bodies - cuerpos
     */
    MouseConstraint.update = function(mouseConstraint, bodies) {
        var mouse = mouseConstraint.mouse,
            constraint = mouseConstraint.constraint,
            body = mouseConstraint.body;

        if (mouse.button === 0) {
            if (!constraint.bodyB) {
                for (var i = 0; i < bodies.length; i++) {
                    body = bodies[i];
                    if (Bounds.contains(body.bounds, mouse.position) 
                            && Detector.canCollide(body.collisionFilter, mouseConstraint.collisionFilter)) {
                        for (var j = body.parts.length > 1 ? 1 : 0; j < body.parts.length; j++) {
                            var part = body.parts[j];
                            if (Vertices.contains(part.vertices, mouse.position)) {
                                constraint.pointA = mouse.position;
                                constraint.bodyB = mouseConstraint.body = body;
                                constraint.pointB = { x: mouse.position.x - body.position.x, y: mouse.position.y - body.position.y };
                                constraint.angleB = body.angle;

                                Sleeping.set(body, false);
                                Events.trigger(mouseConstraint, 'startdrag', { mouse: mouse, body: body });

                                break;
                            }
                        }
                    }
                }
            } else {
                Sleeping.set(constraint.bodyB, false);
                constraint.pointA = mouse.position;
            }
        } else {
            constraint.bodyB = mouseConstraint.body = null;
            constraint.pointB = null;

            if (body)
                Events.trigger(mouseConstraint, 'enddrag', { mouse: mouse, body: body });
        }
    };

    /**
     * Activa eventos de restricción del ratón.
     * @method _triggerEvents
     * @private
     * @param {mouse} mouseConstraint
     */
    var _triggerEvents = function(mouseConstraint) {
        var mouse = mouseConstraint.mouse,
            mouseEvents = mouse.sourceEvents;

        if (mouseEvents.mousemove)
            Events.trigger(mouseConstraint, 'mousemove', { mouse: mouse });

        if (mouseEvents.mousedown)
            Events.trigger(mouseConstraint, 'mousedown', { mouse: mouse });

        if (mouseEvents.mouseup)
            Events.trigger(mouseConstraint, 'mouseup', { mouse: mouse });

        // restablecer el estado del ratón listo para el siguiente paso
        Mouse.clearSourceEvents(mouse);
    };

    /*
    *
    *  Documentación de eventos
    *
    */

    /**
    * Se dispara cuando el ratón se ha movido (o se mueve un toque) durante el último paso
    *
    * @event mousemove 
    * @param {} event Un objeto de evento
    * @param {mouse} event.mouse La instancia del ratón del motor
    * @param {} event.source El objeto fuente del evento
    * @param {} event.name El nombre del evento
    */

    /**
    * Se dispara cuando el ratón está abajo (o se ha iniciado un toque) durante el último paso
    *
    * @event mousedown
    * @param {} event Un objeto de evento
    * @param {mouse} event.mouse La instancia del ratón del motor
    * @param {} event.source El objeto fuente del evento
    * @param {} event.name El nombre del evento
    */

    /**
    * Se dispara cuando el ratón está arriba (o un toque ha finalizado) durante el último paso
    *
    * @event mouseup
    * @param {} event Un objeto de evento
    * @param {mouse} event.mouse La instancia del motor del ratón
    * @param {} event.source El objeto fuente del evento
    * @param {} event.name El nombre del evento 
    */

    /**
    * Se dispara cuando el usuario comienza a arrastrar un cuerpo.
    *
    * @event startdrag
    * @param {} event Un objeto de evento
    * @param {mouse} event.mouse La instancia del motor del ratón.
    * @param {body} event.body El cuerpo siendo arrastrado
    * @param {} event.source El objeto fuente del evento
    * @param {} event.name El nombre del evento
    */

    /**
    * Se dispara cuando el usuario termina arrastrando un cuerpo.
    *
    * @event enddrag
    * @param {} event Un objeto de evento	
    * @param {mouse} event.mouse La instancia del motor del ratón.
    * @param {body} event.body El cuerpo que ha dejado de ser arrastrado
    * @param {} event.source El objeto fuente del evento
    * @param {} event.name El nombre del evento
    */

    /*
    *
    *  Documentación de propiedades
    *
    */

    /**
     * Una `Cadena` que indica el tipo de objeto.
     *
     * @property type - tipo
     * @type string - cadena
     * @default "constraint" - "restricción"
     * @readOnly
     */

    /**
     * La instancia de `Ratón` en uso. Si no se proporciona en `MouseConstraint.create`, se creará uno.
     *
     * @property mouse - ratón
     * @type mouse - ratón
     * @default mouse - ratón
     */

    /**
     * El  `Cuerpo` que el usuario está moviendo actualmente, o `nulo` si no hay cuerpo.
     *
     * @property body - cuerpo
     * @type body - cuerpo
     * @default null - nulo
     */

    /**
     * Objeto `Restricción` que se utiliza para mover el cuerpo durante la interacción.
     *
     * @property constraint - restricción
     * @type constraint - restricción
     */

    /**
     * Un `Objeto` que especifica las propiedades del filtro de colisión.
     * El filtro de colisión permite al usuario definir con qué tipos de cuerpo puede interactuar esta restricción del ratón.
     * Consulte `body.collisionFilter` para obtener más información.
     *
     * @property collisionFilter
     * @type object - objeto
     */

})();

},{"../body/Composite":2,"../collision/Detector":5,"../core/Common":14,"../core/Events":16,"../core/Mouse":19,"../core/Sleeping":22,"../geometry/Bounds":26,"../geometry/Vertices":29,"./Constraint":12}],14:[function(_dereq_,module,exports){
/**
* El módulo `Matter.Common` contiene funciones de utilidad que son comunes a todos los módulos.
*
* @class Common - Común
*/

var Common = {};

module.exports = Common;

(function() {

    Common._nextId = 0;
    Common._seed = 0;

    /**
     * Extiende el objeto en el primer argumento usando el objeto en el segundo argumento.
     * @method extend - extender
     * @param {} obj
     * @param {boolean} deep - profundo
     * @return {} obj extended - extendido
     */
    Common.extend = function(obj, deep) {
        var argsStart,
            args,
            deepClone;

        if (typeof deep === 'boolean') {
            argsStart = 2;
            deepClone = deep;
        } else {
            argsStart = 1;
            deepClone = true;
        }

        for (var i = argsStart; i < arguments.length; i++) {
            var source = arguments[i];

            if (source) {
                for (var prop in source) {
                    if (deepClone && source[prop] && source[prop].constructor === Object) {
                        if (!obj[prop] || obj[prop].constructor === Object) {
                            obj[prop] = obj[prop] || {};
                            Common.extend(obj[prop], deepClone, source[prop]);
                        } else {
                            obj[prop] = source[prop];
                        }
                    } else {
                        obj[prop] = source[prop];
                    }
                }
            }
        }
        
        return obj;
    };

    /**
     * Crea un nuevo clon del objeto, si deep (profundo) es true, también se clonarán las referencias.
     * @method clone - clon
     * @param {} obj
     * @param {bool} deep - profundo
     * @return {} obj cloned - clonado
     */
    Common.clone = function(obj, deep) {
        return Common.extend({}, deep, obj);
    };

    /**
     * Devuelve la lista de claves para el objeto dado.
     * @method keys - claves
     * @param {} obj - objeto
     * @return {string[]} keys - claves
     */
    Common.keys = function(obj) {
        if (Object.keys)
            return Object.keys(obj);

        // evitar hasOwnProperty (tienePropiedadPropia) para el rendimiento
        var keys = [];
        for (var key in obj)
            keys.push(key);
        return keys;
    };

    /**
     * Devuelve la lista de valores para el objeto dado.
     * @method values - valores
     * @param {} obj - objeto
     * @return {array} Matriz de objetos, valores de propiedad
     */
    Common.values = function(obj) {
        var values = [];
        
        if (Object.keys) {
            var keys = Object.keys(obj);
            for (var i = 0; i < keys.length; i++) {
                values.push(obj[keys[i]]);
            }
            return values;
        }
        
        // evitar hasOwnProperty (tiene propiedad propia) para el rendimiento
        for (var key in obj)
            values.push(obj[key]);
        return values;
    };

    /**
     * Obtiene un valor de `base` relativo a la cadena de `ruta`.
     * @method get - obtener
     * @param {} obj El objeto base
     * @param {string} path La ruta relativa a `base`, p. Ej. 'Foo.Bar.baz'
     * @param {number} [begin Comienzo del segmento de ruta
     * @param {number} [end] Final del segmento de ruta
     * @return {} El objeto en la ruta dada
     */
    Common.get = function(obj, path, begin, end) {
        path = path.split('.').slice(begin, end);

        for (var i = 0; i < path.length; i += 1) {
            obj = obj[path[i]];
        }

        return obj;
    };

    /**
     * Establece un valor en `base` relativo a la cadena de `ruta` dada.
     * @method set - configurar
     * @param {} obj El objeto base
     * @param {string} path La ruta relativa a `base`, p. Ej. 'Foo.Bar.baz'
     * @param {} val El valor a establecer
     * @param {number} [begin] Comienzo del segmento de ruta
     * @param {number} [end] Final del segmento de ruta
     * @return {} Pase por `val` para encadenar
     */
    Common.set = function(obj, path, val, begin, end) {
        var parts = path.split('.').slice(begin, end);
        Common.get(obj, path, 0, -1)[parts[parts.length - 1]] = val;
        return val;
    };

    /**
     * Devuelve una cadena de color hexadecimal hecha al aclarar u oscurecer el color en porcentaje.
     * @method shadeColor
     * @param {string} color - color
     * @param {number} percent - por ciento
     * @return {string} Un color hexadecimal
     */
    Common.shadeColor = function(color, percent) {   
        // http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color
        var colorInteger = parseInt(color.slice(1),16), 
            amount = Math.round(2.55 * percent), 
            R = (colorInteger >> 16) + amount, 
            B = (colorInteger >> 8 & 0x00FF) + amount, 
            G = (colorInteger & 0x0000FF) + amount;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R :255) * 0x10000 
                + (B < 255 ? B < 1 ? 0 : B : 255) * 0x100 
                + (G < 255 ? G < 1 ? 0 : G : 255)).toString(16).slice(1);
    };

    /**
     * Mezcla la matriz dada en su lugar.
     * La función utiliza un generador aleatorio sembrado.
     * @method shuffle - revolver
     * @param {array} array - formación
     * @return {array} matriz aleatoria
     */
    Common.shuffle = function(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Common.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    };

    /**
     * Elige aleatoriamente un valor de una lista con la misma probabilidad.
     * La función utiliza un generador aleatorio sembrado.
     * @method choose - escoger
     * @param {array} choices - escoger
     * @return {object} Un objeto de elección aleatoria de la matriz
     */
    Common.choose = function(choices) {
        return choices[Math.floor(Common.random() * choices.length)];
    };

    /**
     * Devuelve verdadero si el objeto es un HTMLElement (elemento HTML); de lo contrario, es falso.
     * @method isElement
     * @param {object} obj
     * @return {boolean} Verdadero si el objeto es un elemento HTMLE; de lo contrario, es falso
     */
    Common.isElement = function(obj) {
        // http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
        try {
            return obj instanceof HTMLElement;
        }
        catch(e){
            return (typeof obj==="object") &&
              (obj.nodeType===1) && (typeof obj.style === "object") &&
              (typeof obj.ownerDocument ==="object");
        }
    };

    /**
     * Devuelve verdadero si el objeto es una matriz.
     * @method isArray
     * @param {object} obj
     * @return {boolean} Verdadero si el objeto es una matriz, de lo contrario es falso
     */
    Common.isArray = function(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    };

    /**
     * Devuelve verdadero si el objeto es una función.
     * @method isFunction
     * @param {object} obj
     * @return {boolean} Verdadero si el objeto es una función, de lo contrario es falso
     */
    Common.isFunction = function(obj) {
        return typeof obj === "function";
    };

    /**
     * Devuelve verdadero si el objeto es un objeto simple.
     * @method isPlainObject
     * @param {object} obj
     * @return {boolean} Verdadero si el objeto es un objeto simple, de lo contrario es falso
     */
    Common.isPlainObject = function(obj) {
        return typeof obj === 'object' && obj.constructor === Object;
    };

    /**
     * Devuelve verdadero si el objeto es una cadena.
     * @method isString 
     * @param {object} obj
     * @return {boolean} Verdadero si el objeto es una cadena, de lo contrario es falso
     */
    Common.isString = function(obj) {
        return toString.call(obj) === '[object String]';
    };
    
    /**
     * Devuelve el valor dado sujeto entre un valor mínimo y máximo.
     * @method clamp - sujeto
     * @param {number} value - valor
     * @param {number} min - mínimo
     * @param {number} max - máximo
     * @return {number} El valor fijado entre mínimo y máximo inclusive
     */
    Common.clamp = function(value, min, max) {
        if (value < min)
            return min;
        if (value > max)
            return max;
        return value;
    };
    
    /**
     * Devuelve el signo del valor dado.
     * @method sign - signo
     * @param {number} value - valor
     * @return {number} -1 si es negativo, +1 si es 0 o positivo
     */
    Common.sign = function(value) {
        return value < 0 ? -1 : 1;
    };
    
    /**
     * Devuelve la marca de tiempo actual (alta resolución si está disponible).
     * @method now - ahora
     * @return {number} la marca de tiempo actual (alta resolución si está disponible)
     */
    Common.now = function() {
        // http://stackoverflow.com/questions/221294/how-do-you-get-a-timestamp-in-javascript
        // https://gist.github.com/davidwaterston/2982531

        var performance = window.performance || {};

        performance.now = (function() {
            return performance.now    ||
            performance.webkitNow     ||
            performance.msNow         ||
            performance.oNow          ||
            performance.mozNow        ||
            function() { return +(new Date()); };
        })();
              
        return performance.now();
    };
    
    /**
     * Devuelve un valor aleatorio entre un valor mínimo y máximo inclusivo.
     * La función utiliza un generador aleatorio sembrado.
     * @method random - aleatorio
     * @param {number} min - mínimo
     * @param {number} max - máximo
     * @return {number} Un número aleatorio entre mínimo y máximo inclusivo
     */
    Common.random = function(min, max) {
        min = (typeof min !== "undefined") ? min : 0;
        max = (typeof max !== "undefined") ? max : 1;
        return min + _seededRandom() * (max - min);
    };

    var _seededRandom = function() {
        // https://gist.github.com/ngryman/3830489
        Common._seed = (Common._seed * 9301 + 49297) % 233280;
        return Common._seed / 233280;
    };

    /**
     * Convierte una cadena de color hexadecimal CSS en un número entero.
     * @method colorToNumber 
     * @param {string} colorString 
     * @return {number} Un número entero que representa la cadena hexadecimal CSS
     */
    Common.colorToNumber = function(colorString) {
        colorString = colorString.replace('#','');

        if (colorString.length == 3) {
            colorString = colorString.charAt(0) + colorString.charAt(0)
                        + colorString.charAt(1) + colorString.charAt(1)
                        + colorString.charAt(2) + colorString.charAt(2);
        }

        return parseInt(colorString, 16);
    };

    /**
     * El nivel de registro de la consola que se utilizará, donde cada nivel incluye todos los niveles superiores y excluye los niveles inferiores.
     * El nivel predeterminado es 'depuración', que muestra todos los mensajes de la consola.  
     *
     * Los posibles valores de nivel son:
     * - 0 = ninguno
     * - 1 = Depurar
     * - 2 = Información
     * - 3 = Advertencia
     * - 4 = Error
     * @property Common.logLevel
     * @type {Number}
     * @default 1
     */
    Common.logLevel = 1;

    /**
     * Muestra un mensaje `console.log` solo si el `Common.logLevel` actual lo permite.
     * El mensaje tendrá el prefijo 'matter-js' para que sea fácilmente identificable.
     * @method log - regristro
     * @param ...objs {} Los objetos a registrar.
     */
    Common.log = function() {
        if (console && Common.logLevel > 0 && Common.logLevel <= 3) {
            console.log.apply(console, ['matter-js:'].concat(Array.prototype.slice.call(arguments)));
        }
    };

    /**
     * Muestra un mensaje `console.info` solo si el` Common.logLevel` actual lo permite.
     * El mensaje tendrá el prefijo 'matter-js' para que sea fácilmente identificable.
     * @method info - información
     * @param ...objs {} Los objetos a registrar.
     */
    Common.info = function() {
        if (console && Common.logLevel > 0 && Common.logLevel <= 2) {
            console.info.apply(console, ['matter-js:'].concat(Array.prototype.slice.call(arguments)));
        }
    };

    /**
     * Muestra un mensaje `console.warn` solo si el` Common.logLevel` actual lo permite.
     * El mensaje tendrá el prefijo 'matter-js' para que sea fácilmente identificable.
     * @method warn - advertencia
     * @param ...objs {} Los objetos a registrar.
     */
    Common.warn = function() {
        if (console && Common.logLevel > 0 && Common.logLevel <= 3) {
            console.warn.apply(console, ['matter-js:'].concat(Array.prototype.slice.call(arguments)));
        }
    };

    /**
     * Devuelve el siguiente ID secuencial único.
     * @method nextId 
     * @return {Number} Unico ID secuencial
     */
    Common.nextId = function() {
        return Common._nextId++;
    };

    /**
     * Una implementación indexOf compatible con varios navegadores.
     * @method indexOf 
     * @param {array} haystack - pajar 
     * @param {object} needle - aguja
     * @return {number} La posición de la aguja en el pajar, de lo contrario -1.
     */
    Common.indexOf = function(haystack, needle) {
        if (haystack.indexOf)
            return haystack.indexOf(needle);

        for (var i = 0; i < haystack.length; i++) {
            if (haystack[i] === needle)
                return i;
        }

        return -1;
    };

    /**
     * Una implementación de mapa de matriz compatible con varios navegadores.
     * @method map - mapa
     * @param {array} list - lista
     * @param {function} func - función
     * @return {array} Valores de la lista transformados por func.
     */
    Common.map = function(list, func) {
        if (list.map) {
            return list.map(func);
        }

        var mapped = [];

        for (var i = 0; i < list.length; i += 1) {
            mapped.push(func(list[i]));
        }

        return mapped;
    };

    /**
     * Toma un gráfico dirigido y devuelve el conjunto de vértices parcialmente ordenado en orden topológico.
     * Se permiten dependencias circulares.
     * @method topologicalSort
     * @param {object} graph - gráfica
     * @return {array} Conjunto de vértices parcialmente ordenados en orden topológico.
     */
    Common.topologicalSort = function(graph) {
        // https://mgechev.github.io/javascript-algorithms/graphs_others_topological-sort.js.html
        var result = [],
            visited = [],
            temp = [];

        for (var node in graph) {
            if (!visited[node] && !temp[node]) {
                _topologicalSort(node, visited, temp, graph, result);
            }
        }

        return result;
    };

    var _topologicalSort = function(node, visited, temp, graph, result) {
        var neighbors = graph[node] || [];
        temp[node] = true;

        for (var i = 0; i < neighbors.length; i += 1) {
            var neighbor = neighbors[i];

            if (temp[neighbor]) {
                // skip circular dependencies
                continue;
            }

            if (!visited[neighbor]) {
                _topologicalSort(neighbor, visited, temp, graph, result);
            }
        }

        temp[node] = false;
        visited[node] = true;

        result.push(node);
    };

    /**
     * Toma _n_ funciones como argumentos y devuelve una nueva función que las llama en orden.
     * Los argumentos aplicados al llamar a la nueva función también se aplicarán a cada función pasada.
     * El valor de "esto" se refiere al último valor devuelto en la cadena que no estaba "indefinido".
     * Por lo tanto, si una función pasada no devuelve un valor, se mantiene el valor devuelto anteriormente.
     * Después de que se hayan llamado todas las funciones pasadas, la nueva función devuelve el último valor devuelto (si lo hubiera).
     * Si alguna de las funciones pasadas es una cadena, entonces la cadena se aplanará.
     * @method chain - cadena
     * @param ...funcs {function} Las funciones para encadenar.
     * @return {function} Una nueva función que llama a las funciones pasadas en orden.
     */
    Common.chain = function() {
        var funcs = [];

        for (var i = 0; i < arguments.length; i += 1) {
            var func = arguments[i];

            if (func._chained) {
                // flatten already chained functions
                funcs.push.apply(funcs, func._chained);
            } else {
                funcs.push(func);
            }
        }

        var chain = function() {
            // https://github.com/GoogleChrome/devtools-docs/issues/53#issuecomment-51941358
            var lastResult,
                args = new Array(arguments.length);

            for (var i = 0, l = arguments.length; i < l; i++) {
                args[i] = arguments[i];
            }

            for (i = 0; i < funcs.length; i += 1) {
                var result = funcs[i].apply(lastResult, args);

                if (typeof result !== 'undefined') {
                    lastResult = result;
                }
            }

            return lastResult;
        };

        chain._chained = funcs;

        return chain;
    };

    /**
     * Encadena una función para ejecutar antes de la función original en la `path` dada en relación con la` base`.
     * Consulte también los documentos de `Common.chain`.
     * @method chainPathBefore
     * @param {} base El objeto base
     * @param {string} path La ruta relativa a 'base'
     * @param {function} func La función de encadenar antes que el original.
     * @return {function}  La función encadenada que reemplazó al original
     */
    Common.chainPathBefore = function(base, path, func) {
        return Common.set(base, path, Common.chain(
            func,
            Common.get(base, path)
        ));
    };

    /**
     * Encadena una función para ejecutar después de la función original en la `ruta` dada en relación con la `base`.
     * Consulte también los documentos de `Common.chain`.
     * @method chainPathAfter
     * @param {} base El objeto base
     * @param {string} path La ruta relativa a `base`
     * @param {function} func La función de encadenar después del original.
     * @return {function} La función encadenada que reemplazó al original
     */
    Common.chainPathAfter = function(base, path, func) {
        return Common.set(base, path, Common.chain(
            Common.get(base, path),
            func
        ));
    };

})();

},{}],15:[function(_dereq_,module,exports){
/**
* El módulo `Matter.Engine` contiene métodos para crear y manipular motores.
* Un motor es un controlador que gestiona la actualización de la simulación del mundo.
* Consulte `Matter.Runner` para obtener una utilidad de bucle en un juego opcional.
*
* Ver el uso incluido [ejemplos](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Engine - Motor
*/

var Engine = {};

module.exports = Engine;

var World = _dereq_('../body/World');
var Sleeping = _dereq_('./Sleeping');
var Resolver = _dereq_('../collision/Resolver');
var Render = _dereq_('../render/Render');
var Pairs = _dereq_('../collision/Pairs');
var Metrics = _dereq_('./Metrics');
var Grid = _dereq_('../collision/Grid');
var Events = _dereq_('./Events');
var Composite = _dereq_('../body/Composite');
var Constraint = _dereq_('../constraint/Constraint');
var Common = _dereq_('./Common');
var Body = _dereq_('../body/Body');

(function() {

    /**
     * Crea un nuevo motor. El parámetro de opciones es un objeto que especifica las propiedades que desees anular de los valores predeterminados.
     * Todas las propiedades tienen valores predeterminados y muchas se precalculan automáticamente en función de otras propiedades.
     * Consulte la sección de propiedades a continuación para obtener información detallada sobre lo que puede pasar a través del objeto `options`.
     * @method create - crear
     * @param {object} [options]
     * @return {engine} engine - motor
     */
    Engine.create = function(element, options) {
        // opcion puede pasar como el primer (y único) argumento
        options = Common.isElement(element) ? options : element;
        element = Common.isElement(element) ? element : null;
        options = options || {};

        if (element || options.render) {
            Common.warn('Engine.create: engine.render is deprecated (see docs)');
        }

        var defaults = {
            positionIterations: 6,
            velocityIterations: 4,
            constraintIterations: 2,
            enableSleeping: false,
            events: [],
            plugin: {},
            timing: {
                timestamp: 0,
                timeScale: 1
            },
            broadphase: {
                controller: Grid
            }
        };

        var engine = Common.extend(defaults, options);

        // @deprecated
        if (element || engine.render) {
            var renderDefaults = {
                element: element,
                controller: Render
            };
            
            engine.render = Common.extend(renderDefaults, engine.render);
        }

        // @deprecated
        if (engine.render && engine.render.controller) {
            engine.render = engine.render.controller.create(engine.render);
        }

        // @deprecated
        if (engine.render) {
            engine.render.engine = engine;
        }

        engine.world = options.world || World.create(engine.world);
        engine.pairs = Pairs.create();
        engine.broadphase = engine.broadphase.controller.create(engine.broadphase);
        engine.metrics = engine.metrics || { extended: false };


        return engine;
    };

    /**
     * Avanza la simulación en el tiempo por `delta` ms.
     * El argumento `corrección` es un `Número` opcional que especifica el factor de corrección de tiempo que se aplicará a la actualización.
     * Esto puede ayudar a mejorar la precisión de la simulación en los casos en los que `delta` cambia entre actualizaciones.
     * El valor de `corrección` se define como `delta / lastDelta`, es decir, el cambio porcentual de `delta` en el último paso.
     * Por lo tanto, el valor es siempre `1` (sin corrección) cuando` delta` es constante (o cuando no se desea ninguna corrección, que es el valor predeterminado).
     * Consulte el documento en <a href="http://lonesock.net/article/verlet.html"> Time Corrected Verlet </a> para obtener más información.
     *
     * Activa los eventos `beforeUpdate` y` afterUpdate`.
     * Activa los eventos `collisionStart`,` collisionActive` y `collisionEnd`.
     * @method update - actualización
     * @param {engine} engine - motor
     * @param {number} [delta=16.666]
     * @param {number} [correction=1]
     */
    Engine.update = function(engine, delta, correction) {
        delta = delta || 1000 / 60;
        correction = correction || 1;

        var world = engine.world,
            timing = engine.timing,
            broadphase = engine.broadphase,
            broadphasePairs = [],
            i;

        // incremento de marca de tiempo
        timing.timestamp += delta * timing.timeScale;

        // crea un objeto de evento
        var event = {
            timestamp: timing.timestamp
        };

        Events.trigger(engine, 'beforeUpdate', event);

        // obten listas de todos los cuerpos y restricciones, sin importar en qué compuestos se encuentren
        var allBodies = Composite.allBodies(world),
            allConstraints = Composite.allConstraints(world);


        // si está habilitado sleeping, llame al controlador para ejecutar sleeping
        if (engine.enableSleeping)
            Sleeping.update(allBodies, timing.timeScale);

        // aplica gravedad a todos los cuerpos
        _bodiesApplyGravity(allBodies, world.gravity);

        // actualiza toda la posición del cuerpo y la rotación por integración
        _bodiesUpdate(allBodies, delta, timing.timeScale, correction, world.bounds);

        // actualizar todas las restricciones
        for (i = 0; i < engine.constraintIterations; i++) {
            Constraint.solveAll(allConstraints, timing.timeScale);
        }
        Constraint.postSolveAll(allBodies);

        // pase de fase ancha: encuentra pares de colisión potenciales
        if (broadphase.controller) {

            // si el mundo está sucio, debemos limpiar toda la red
            if (world.isModified)
                broadphase.controller.clear(broadphase);

            // actualizar los depósitos de la cuadrícula en función de los cuerpos actuales
            broadphase.controller.update(broadphase, allBodies, engine, world.isModified);
            broadphasePairs = broadphase.pairsList;
        } else {

            // si no hay una fase ancha, simplemente pasamos todos los cuerpos
            broadphasePairs = allBodies;
        }

        // borrar todas las marcas modificadas compuestas
        if (world.isModified) {
            Composite.setModified(world, false, false, true);
        }

        // Pase de fase estrecha: encuentre colisiones reales, luego cree o actualice pares de colisiones 	
        var collisions = broadphase.detector(broadphasePairs, engine);

        // actualizar pares de colisiones
        var pairs = engine.pairs,
            timestamp = timing.timestamp;
        Pairs.update(pairs, collisions, timestamp);
        Pairs.removeOld(pairs, timestamp);

        // Despierta cuerpos involucrados en colisiones.
        if (engine.enableSleeping)
            Sleeping.afterCollisions(pairs.list, timing.timeScale);

        // desencadena eventos de colisión
        if (pairs.collisionStart.length > 0)
            Events.trigger(engine, 'collisionStart', { pairs: pairs.collisionStart });

        // resolver iterativamente la posición entre colisiones
        Resolver.preSolvePosition(pairs.list);
        for (i = 0; i < engine.positionIterations; i++) {
            Resolver.solvePosition(pairs.list, timing.timeScale);
        }
        Resolver.postSolvePosition(allBodies);

        // resolver iterativamente la velocidad entre colisiones
        Resolver.preSolveVelocity(pairs.list);
        for (i = 0; i < engine.velocityIterations; i++) {
            Resolver.solveVelocity(pairs.list, timing.timeScale);
        }

        // desencadenar eventos de colisión
        if (pairs.collisionActive.length > 0)
            Events.trigger(engine, 'collisionActive', { pairs: pairs.collisionActive });

        if (pairs.collisionEnd.length > 0)
            Events.trigger(engine, 'collisionEnd', { pairs: pairs.collisionEnd });


        // borrar amortiguadores de fuerza
        _bodiesClearForces(allBodies);

        Events.trigger(engine, 'afterUpdate', event);

        return engine;
    };
    
    /**
     * Fusiona dos motores manteniendo la configuración de `engineA` pero reemplazando el mundo con el de `engineB`.
     * @method merge - unir
     * @param {engine} engineA 
     * @param {engine} engineB 
     */
    Engine.merge = function(engineA, engineB) {
        Common.extend(engineA, engineB);
        
        if (engineB.world) {
            engineA.world = engineB.world;

            Engine.clear(engineA);

            var bodies = Composite.allBodies(engineA.world);

            for (var i = 0; i < bodies.length; i++) {
                var body = bodies[i];
                Sleeping.set(body, false);
                body.id = Common.nextId();
            }
        }
    };

    /**
     * Borra el motor incluido el mundo, los pares y la fase ancha.
     * @method clear - despejar
     * @param {engine} engine - motor
     */
    Engine.clear = function(engine) {
        var world = engine.world;
        
        Pairs.clear(engine.pairs);

        var broadphase = engine.broadphase;
        if (broadphase.controller) {
            var bodies = Composite.allBodies(world);
            broadphase.controller.clear(broadphase);
            broadphase.controller.update(broadphase, bodies, engine, true);
        }
    };

    /**
     * Poner a cero los amortiguadores de fuerza de `body.force` y` body.torque`.
     * @method bodiesClearForces 
     * @private
     * @param {body[]} bodies - cuerpos
     */
    var _bodiesClearForces = function(bodies) {
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];

            // reset force buffers
            body.force.x = 0;
            body.force.y = 0;
            body.torque = 0;
        }
    };

    /**
     * Aplica una fuerza dependiente de la masa a todos los cuerpos dados.
     * @method bodiesApplyGravity
     * @private
     * @param {body[]} bodies - cuerpos
     * @param {vector} gravity - gravedad
     */
    var _bodiesApplyGravity = function(bodies, gravity) {
        var gravityScale = typeof gravity.scale !== 'undefined' ? gravity.scale : 0.001;

        if ((gravity.x === 0 && gravity.y === 0) || gravityScale === 0) {
            return;
        }
        
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];

            if (body.isStatic || body.isSleeping)
                continue;

            // apply gravity
            body.force.y += body.mass * gravity.y * gravityScale;
            body.force.x += body.mass * gravity.x * gravityScale;
        }
    };

    /**
     * Aplica `Body.update` a todos los `cuerpos` dados.
     * @method updateAll 
     * @private
     * @param {body[]} bodies - cuerpos
     * @param {number} deltaTime
     * La cantidad de tiempo transcurrido entre actualizaciones.
     * @param {number} timeScale
     * @param {number} correction - correción
     * El factor de corrección de Verlet (deltaTime / lastDeltaTime)
     * @param {bounds} worldBounds 
     */
    var _bodiesUpdate = function(bodies, deltaTime, timeScale, correction, worldBounds) {
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];

            if (body.isStatic || body.isSleeping)
                continue;

            Body.update(body, deltaTime, timeScale, correction);
        }
    };

    /**
     * Un alias para `Runner.run`, consulte` Matter.Runner` para obtener más información.
     * @method run - correr
     * @param {engine} engine - motor
     */

    /**
    * Disparado justo antes de una actualización
    *
    * @event beforeUpdate
    * @param {} event Un objeto de evento
    * @param {number} event.timestamp El engine.timing.timestamp del evento
    * @param {} event.source El objeto fuente del evento
    * @param {} event.name El nombre del evento
    */

    /**
    * Disparado después de la actualización del motor y todos los eventos de colisión
    *
    * @event afterUpdate
    * @param {} event Un objeto de evento
    * @param {number} event.timestamp El engine.timing.timestamp del evento
    * @param {} event.source El objeto fuente del evento
    * @param {} event.name El nombre del evento
    */

    /**
    * Activado después de la actualización del motor, proporciona una lista de todos los pares que han comenzado a colisionar en el tick actual (si corresponde)
    *
    * @event collisionStart
    * @param {} event Un objeto de evento
    * @param {} event.pairs Lista de parejas afectadas
    * @param {number} event.timestamp El engine.timing.timestamp del evento
    * @param {} event.source El objeto fuente del evento
    * @param {} event.name El nombre del evento
    */

    /**
    * Activado después de la actualización del motor, proporciona una lista de todos los pares que están colisionando en el tick actual (si corresponde)
    *
    * @event collisionActive
    * @param {} event Un objeto de evento
    * @param {} event.pairs Lista de parejas afectadas
    * @param {number} event.timestamp El engine.timing.timestamp del evento
    * @param {} event.source El objeto fuente del evento
    * @param {} event.name El nombre del evento
    */

    /**
    * Activado después de la actualización del motor, proporciona una lista de todos los pares que han terminado la colisión en el tick actual (si corresponde)
    *
    * @event collisionEnd 
    * @param {} event Un objeto de evento
    * @param {} event.pairs Lista de parejas afectadas
    * @param {number} event.timestamp El engine.timing.timestamp del evento
    * @param {} event.source El objeto fuente del evento
    * @param {} event.name El nombre del evento
    */ 

    /*
    *
    *  Documentación de propiedades
    *
    */

    /**
     * Un `Número` entero que especifica el número de iteraciones de posición para realizar cada actualización.
     * Cuanto mayor sea el valor, mayor calidad tendrá la simulación a expensas del rendimiento.
     *
     * @property positionIterations
     * @type number - número
     * @default 6
     */

    /**
     * Un `Número` entero que especifica el número de iteraciones de velocidad para realizar cada actualización.
     * Cuanto mayor sea el valor, mayor calidad tendrá la simulación a expensas del rendimiento.
     *
     * @property velocityIterations
     * @type number - número
     * @default 4
     */

    /**
     * Un `Número` entero que especifica el número de iteraciones de restricción para realizar cada actualización.
     * Cuanto mayor sea el valor, mayor calidad tendrá la simulación a expensas del rendimiento.
     * El valor predeterminado de `2` suele ser muy adecuado.
     *
     * @property constraintIterations
     * @type number - número
     * @default 2
     */

    /**
     * Una marca que especifica si el motor debe dormir a través del módulo `Matter.Sleeping`.
     * Dormir puede mejorar la estabilidad y el rendimiento, pero a menudo a costa de la precisión.
     *
     * @property enableSleeping
     * @type boolean - booleano
     * @default false - falso
     */

    /**
     * Un `Objeto` que contiene propiedades relativas a los sistemas de sincronización del motor.
     *
     * @property timing - sincronización
     * @type object - objeto
     */

    /**
     * Un `Número` que especifica el factor de escala global de tiempo para todos los cuerpos.
     * Un valor de '0' congela la simulación.
     * Un valor de '0.1' da un efecto de cámara lenta.
     * Un valor de '1.2' da un efecto de aceleración.
     *
     * @property timing.timeScale
     * @type number - número
     * @default 1
     */

    /**
     * Un `Número` que especifica el tiempo de simulación actual en milisegundos a partir de `0`.
     * It is incremented on every `Engine.update` by the given `delta` argument. 
     *
     * @property timing.timestamp
     * @type number - número
     * @default 0
     */

    /**
     * Una instancia de un controlador `Render`. El valor predeterminado es una instancia de `Matter.Render` creada por `Engine.create`.
     * También se puede desarrollar un módulo de renderizado personalizado basado en `Matter.Render` y pasar una instancia del mismo a `Engine.create` a través de `options.render`.
     *
     * Un objeto renderizador personalizado mínimo debe definir al menos tres funciones: `create`, `clear` y `world` (consulta `Matter.Render`).
     * También es posible pasar la referencia de _module_ (módulo) a través de `options.render.controller` y` Engine.create` creará una instancia por ti.
     *
     * @property render - renderizar
     * @type render - renderizar
     * @deprecated see Demo.js para un ejemplo de creación de un renderizador
     * @default a Matter.Render instance - isntancia
     */

    /**
     * Una instancia de un controlador de fase ancha. El valor predeterminado es una instancia de `Matter.Grid` creada por `Engine.create`.
     *
     * @property broadphase
     * @type grid - cuadrícula
     * @default a Matter.Grid instance - instancia
     */

    /**
     * Un objeto compuesto `World` que contendrá todos los cuerpos y restricciones simulados.
     *
     * @property world - mundo
     * @type world - mundo
     * @default a Matter.World instance - instancia
     */

    /**
     * Un objeto reservado para almacenar propiedades específicas del complemento.
     *
     * @property plugin
     * @type {}
     */

})();

},{"../body/Body":1,"../body/Composite":2,"../body/World":3,"../collision/Grid":6,"../collision/Pairs":8,"../collision/Resolver":10,"../constraint/Constraint":12,"../render/Render":31,"./Common":14,"./Events":16,"./Metrics":18,"./Sleeping":22}],16:[function(_dereq_,module,exports){
/**
* El módulo `Matter.Events` contiene métodos para disparar y escuchar eventos en otros objetos.
*
* Ver el uso incluido [ejemplos](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Eventos
*/

var Events = {};

module.exports = Events;

var Common = _dereq_('./Common');

(function() {

    /**
     * Suscribe una función de devolución de llamada al 'eventName' del objeto dado.
     * @method on - encendido
     * @param {} object - objeto
     * @param {string} eventNames 
     * @param {function} callback 
     */
    Events.on = function(object, eventNames, callback) {
        var names = eventNames.split(' '),
            name;

        for (var i = 0; i < names.length; i++) {
            name = names[i];
            object.events = object.events || {};
            object.events[name] = object.events[name] || [];
            object.events[name].push(callback);
        }

        return callback;
    };

    /**
     * Elimina la devolución de llamada de evento dada. Si no hay devolución de llamada, borra todas las devoluciones de llamada en `Nombresdeeventos`. Si no hay `Nombresdeeventos`, borra todos los eventos.
     * @method off - apagado
     * @param {} object - objeto
     * @param {string} eventNames 
     * @param {function} callback 
     */
    Events.off = function(object, eventNames, callback) {
        if (!eventNames) {
            object.events = {};
            return;
        }

        // manejar Events.off(object, callback)
        if (typeof eventNames === 'function') {
            callback = eventNames;
            eventNames = Common.keys(object.events).join(' ');
        }

        var names = eventNames.split(' ');

        for (var i = 0; i < names.length; i++) {
            var callbacks = object.events[names[i]],
                newCallbacks = [];

            if (callback && callbacks) {
                for (var j = 0; j < callbacks.length; j++) {
                    if (callbacks[j] !== callback)
                        newCallbacks.push(callbacks[j]);
                }
            }

            object.events[names[i]] = newCallbacks;
        }
    };

    /**
     * Activa todas las devoluciones de llamada suscritas al `Nombredeevento` del objeto dado, en el orden en que se suscribieron, si las hay.
     * @method trigger - desencadenar
     * @param {} object - objeto
     * @param {string} eventNames 
     * @param {} event - evento
     */
    Events.trigger = function(object, eventNames, event) {
        var names,
            name,
            callbacks,
            eventClone;

        if (object.events) {
            if (!event)
                event = {};

            names = eventNames.split(' ');

            for (var i = 0; i < names.length; i++) {
                name = names[i];
                callbacks = object.events[name];

                if (callbacks) {
                    eventClone = Common.clone(event, false);
                    eventClone.name = name;
                    eventClone.source = object;

                    for (var j = 0; j < callbacks.length; j++) {
                        callbacks[j].apply(object, [eventClone]);
                    }
                }
            }
        }
    };

})();

},{"./Common":14}],17:[function(_dereq_,module,exports){
/**
* El módulo `Asunto` es el espacio de nombres de nivel superior. También incluye una función para instalar complementos en la parte superior de la biblioteca.
*
* @class Asunto
*/

var Matter = {};

module.exports = Matter;

var Plugin = _dereq_('./Plugin');
var Common = _dereq_('./Common');

(function() {

    /**
     * El nombre de la biblioteca.
     * @property name - nombre
     * @readOnly
     * @type {String}
     */
    Matter.name = 'matter-js';

    /**
     * El nombre de la biblioteca.
     * @property version - versión
     * @readOnly
     * @type {String}
     */
    Matter.version = '0.12.0';

    /**
     * Una lista de las dependencias de complementos que se instalarán. Normalmente se configuran e instalan a través de `Matter.use`.
     * Alternativamente, puede configurar `Matter.uses` manualmente e instalarlos llamando a `Plugin.use (Matter) `.
     * @property uses - usos
     * @type {Array}
     */
    Matter.uses = [];

    /**
     * Los complementos que se han instalado a través de `Matter.Plugin.install`. Solo de lectura.
     * @property used - usado
     * @readOnly
     * @type {Array}
     */
    Matter.used = [];

    /**
     * Instala los complementos en el espacio de nombres de `Matter`.
     * Esta es una abreviatura de `Plugin.use`, véalo para obtener más información.
     * Llame a esta función una vez al comienzo de su código, con todos los complementos que desea instalar como argumentos.
     * Evite llamar a esta función varias veces a menos que desee controlar manualmente el orden de instalación.
     * @method use - uso
     * @param ...plugin {Function} The plugin(s) to install on `base` (multi-argument).
     */
    Matter.use = function() {
        Plugin.use(Matter, Array.prototype.slice.call(arguments));
    };

    /**
     * Encadena una función para ejecutar antes de la función original en la `Ruta` dada en relación con el `Asunto`.
     * Consulte también los documentos de `Common.chain`.
     * @method before - antes
     * @param {string} path La ruta relativa a "Asunto"
     * @param {function} func La función a encadenar antes que el original.
     * @return {function} La función encadenada que reemplazó al original
     */
    Matter.before = function(path, func) {
        path = path.replace(/^Matter./, '');
        return Common.chainPathBefore(Matter, path, func);
    };

    /**
     * Encadena una función para ejecutar después de la función original en la `ruta` dada en relación con el `Asunto`.
     * Consulte también los documentos de `Common.chain`.
     * @method after - después
     * @param {string} path La ruta relativa a "Asunto"
     * @param {function} func La función de encadenar después del original.
     * @return {function} La función encadenada que reemplazó al original
     */
    Matter.after = function(path, func) {
        path = path.replace(/^Matter./, '');
        return Common.chainPathAfter(Matter, path, func);
    };

})();

},{"./Common":14,"./Plugin":20}],18:[function(_dereq_,module,exports){

},{"../body/Composite":2,"./Common":14}],19:[function(_dereq_,module,exports){
/**
* El módulo `Matter.Mouse` contiene métodos para crear y manipular las entradas del mouse.
*
* @class Ratón
*/

var Mouse = {};

module.exports = Mouse;

var Common = _dereq_('../core/Common');

(function() {

    /**
     * Crea una entrada de mouse.
     * @method create - crear
     * @param {HTMLElement} element - elemento
     * @return {mouse} Un nuevo ratón
     */
    Mouse.create = function(element) {
        var mouse = {};

        if (!element) {
            Common.log('Mouse.create: element was undefined, defaulting to document.body', 'warn');
        }
        
        mouse.element = element || document.body;
        mouse.absolute = { x: 0, y: 0 };
        mouse.position = { x: 0, y: 0 };
        mouse.mousedownPosition = { x: 0, y: 0 };
        mouse.mouseupPosition = { x: 0, y: 0 };
        mouse.offset = { x: 0, y: 0 };
        mouse.scale = { x: 1, y: 1 };
        mouse.wheelDelta = 0;
        mouse.button = -1;
        mouse.pixelRatio = mouse.element.getAttribute('data-pixel-ratio') || 1;

        mouse.sourceEvents = {
            mousemove: null,
            mousedown: null,
            mouseup: null,
            mousewheel: null
        };
        
        mouse.mousemove = function(event) { 
            var position = _getRelativeMousePosition(event, mouse.element, mouse.pixelRatio),
                touches = event.changedTouches;

            if (touches) {
                mouse.button = 0;
                event.preventDefault();
            }

            mouse.absolute.x = position.x;
            mouse.absolute.y = position.y;
            mouse.position.x = mouse.absolute.x * mouse.scale.x + mouse.offset.x;
            mouse.position.y = mouse.absolute.y * mouse.scale.y + mouse.offset.y;
            mouse.sourceEvents.mousemove = event;
        };
        
        mouse.mousedown = function(event) {
            var position = _getRelativeMousePosition(event, mouse.element, mouse.pixelRatio),
                touches = event.changedTouches;

            if (touches) {
                mouse.button = 0;
                event.preventDefault();
            } else {
                mouse.button = event.button;
            }

            mouse.absolute.x = position.x;
            mouse.absolute.y = position.y;
            mouse.position.x = mouse.absolute.x * mouse.scale.x + mouse.offset.x;
            mouse.position.y = mouse.absolute.y * mouse.scale.y + mouse.offset.y;
            mouse.mousedownPosition.x = mouse.position.x;
            mouse.mousedownPosition.y = mouse.position.y;
            mouse.sourceEvents.mousedown = event;
        };
        
        mouse.mouseup = function(event) {
            var position = _getRelativeMousePosition(event, mouse.element, mouse.pixelRatio),
                touches = event.changedTouches;

            if (touches) {
                event.preventDefault();
            }
            
            mouse.button = -1;
            mouse.absolute.x = position.x;
            mouse.absolute.y = position.y;
            mouse.position.x = mouse.absolute.x * mouse.scale.x + mouse.offset.x;
            mouse.position.y = mouse.absolute.y * mouse.scale.y + mouse.offset.y;
            mouse.mouseupPosition.x = mouse.position.x;
            mouse.mouseupPosition.y = mouse.position.y;
            mouse.sourceEvents.mouseup = event;
        };

        mouse.mousewheel = function(event) {
            mouse.wheelDelta = Math.max(-1, Math.min(1, event.wheelDelta || -event.detail));
            event.preventDefault();
        };

        Mouse.setElement(mouse, mouse.element);

        return mouse;
    };

    /**
     * Establece el elemento al que está vinculado el ratón (y al que está relacionado).
     * @method setElement
     * @param {mouse} mouse - ratón
     * @param {HTMLElement} element - elemento
     */
    Mouse.setElement = function(mouse, element) {
        mouse.element = element;

        element.addEventListener('mousemove', mouse.mousemove);
        element.addEventListener('mousedown', mouse.mousedown);
        element.addEventListener('mouseup', mouse.mouseup);
        
        element.addEventListener('mousewheel', mouse.mousewheel);
        element.addEventListener('DOMMouseScroll', mouse.mousewheel);

        element.addEventListener('touchmove', mouse.mousemove);
        element.addEventListener('touchstart', mouse.mousedown);
        element.addEventListener('touchend', mouse.mouseup);
    };

    /**
     * Borra todos los eventos de origen capturados.
     * @method clearSourceEvents
     * @param {mouse} mouse - ratón
     */
    Mouse.clearSourceEvents = function(mouse) {
        mouse.sourceEvents.mousemove = null;
        mouse.sourceEvents.mousedown = null;
        mouse.sourceEvents.mouseup = null;
        mouse.sourceEvents.mousewheel = null;
        mouse.wheelDelta = 0;
    };

    /**
     * Establece el desplazamiento de la posición del ratón.
     * @method setOffset
     * @param {mouse} mouse - ratón
     * @param {vector} offset - distancia 
     */
    Mouse.setOffset = function(mouse, offset) {
        mouse.offset.x = offset.x;
        mouse.offset.y = offset.y;
        mouse.position.x = mouse.absolute.x * mouse.scale.x + mouse.offset.x;
        mouse.position.y = mouse.absolute.y * mouse.scale.y + mouse.offset.y;
    };

    /**
     * Establece la escala de posición del ratón.
     * @method setScale
     * @param {mouse} mouse - ratón
     * @param {vector} scale - escala
     */
    Mouse.setScale = function(mouse, scale) {
        mouse.scale.x = scale.x;
        mouse.scale.y = scale.y;
        mouse.position.x = mouse.absolute.x * mouse.scale.x + mouse.offset.x;
        mouse.position.y = mouse.absolute.y * mouse.scale.y + mouse.offset.y;
    };
    
    /**
     * Obtiene la posición del ratón relativa a un elemento dada una proporción de píxeles de la pantalla.
     * @method _getRelativeMousePosition
     * @private
     * @param {} event - evento
     * @param {} element - elemento
     * @param {number} pixelRatio 
     * @return {}
     */
    var _getRelativeMousePosition = function(event, element, pixelRatio) {
        var elementBounds = element.getBoundingClientRect(),
            rootNode = (document.documentElement || document.body.parentNode || document.body),
            scrollX = (window.pageXOffset !== undefined) ? window.pageXOffset : rootNode.scrollLeft,
            scrollY = (window.pageYOffset !== undefined) ? window.pageYOffset : rootNode.scrollTop,
            touches = event.changedTouches,
            x, y;
        
        if (touches) {
            x = touches[0].pageX - elementBounds.left - scrollX;
            y = touches[0].pageY - elementBounds.top - scrollY;
        } else {
            x = event.pageX - elementBounds.left - scrollX;
            y = event.pageY - elementBounds.top - scrollY;
        }

        return { 
            x: x / (element.clientWidth / (element.width || element.clientWidth) * pixelRatio),
            y: y / (element.clientHeight / (element.height || element.clientHeight) * pixelRatio)
        };
    };

})();

},{"../core/Common":14}],20:[function(_dereq_,module,exports){
/**
* El módulo `Matter.Plugin` contiene funciones para registrar e instalar complementos en los módulos.
*
* @class Plugin - complemento
*/

var Plugin = {};

module.exports = Plugin;

var Common = _dereq_('./Common');

(function() {

    Plugin._registry = {};

    /**
     * Registra un objeto de complemento para que pueda resolverse más tarde por su nombre.
     * @method register - registro
     * @param plugin {} El complemento para registrarse
     * @return {object} El complemento
     */
    Plugin.register = function(plugin) {
        if (!Plugin.isPlugin(plugin)) {
            Common.warn('Plugin.register:', Plugin.toString(plugin), 'does not implement all required fields.');
        }

        if (plugin.name in Plugin._registry) {
            var registered = Plugin._registry[plugin.name],
                pluginVersion = Plugin.versionParse(plugin.version).number,
                registeredVersion = Plugin.versionParse(registered.version).number;

            if (pluginVersion > registeredVersion) {
                Common.warn('Plugin.register:', Plugin.toString(registered), 'was upgraded to', Plugin.toString(plugin));
                Plugin._registry[plugin.name] = plugin;
            } else if (pluginVersion < registeredVersion) {
                Common.warn('Plugin.register:', Plugin.toString(registered), 'can not be downgraded to', Plugin.toString(plugin));
            } else if (plugin !== registered) {
                Common.warn('Plugin.register:', Plugin.toString(plugin), 'is already registered to different plugin object');
            }
        } else {
            Plugin._registry[plugin.name] = plugin;
        }

        return plugin;
    };

    /**
     * Resuelve una dependencia a un objeto de complemento del registro, si existe.
     * La `dependencia` puede contener una versión, pero solo el nombre importa al resolver.
     * @method resolve - resolver
     * @param dependency {string} The dependency. - La dependencia
     * @return {object} El complemento si se resuelve, de lo contrario, `indefinido`.
     */
    Plugin.resolve = function(dependency) {
        return Plugin._registry[Plugin.dependencyParse(dependency).name];
    };

    /**
     * Devuelve un nombre y una versión impresos del complemento.
     * @method toString
     * @param plugin {} The plugin. - El complemento
     * @return {string} Nombre y versión impresos del complemento.
     */
    Plugin.toString = function(plugin) {
        return typeof plugin === 'string' ? plugin : (plugin.name || 'anonymous') + '@' + (plugin.version || plugin.range || '0.0.0');
    };

    /**
     * Devuelve "verdadero" si el objeto cumple con el estándar mínimo para ser considerado un complemento.
     * Esto significa que debe definir las siguientes propiedades:
     * - `nombre`
     * - `versión`
     * - `instalación`
     * @method isPlugin
     * @param obj {} El objeto a probar.
     * @return {boolean} `true` si el objeto puede considerarse un complemento; de lo contrario, es` false`.
     */
    Plugin.isPlugin = function(obj) {
        return obj && obj.name && obj.version && obj.install;
    };

    /**
     * Devuelve `verdadero` si se ha instalado un complemento con el `nombre` dado en el `módulo`.
     * @method isUsed 
     * @param module {} The module. - El módulo.
     * @param name {string} El nombre del complemento. 
     * @return {boolean} `verdadero` si se ha instalado un complemento con el `nombre` dado en el `módulo`, en caso contrario` falso`.
     */
    Plugin.isUsed = function(module, name) {
        return module.used.indexOf(name) > -1;
    };

    /**
     * Devuelve `true` si `plugin.for` es aplicable a `module` comparándolo con `module.name` y `module.version`.
     * Si no se especifica "plugin.for", se asume que es aplicable.
     * El valor de `plugin.for` es una cadena con el formato `'module-name'` o `'module-name@version'`.
     * @method isFor
     * @param plugin {} The plugin.
     * @param module {} The module. - El módulo.
     * @return {boolean} `verdadero` si `plugin.for` es aplicable a `módulo`, en caso contrario,` falso`.
     */
    Plugin.isFor = function(plugin, module) {
        var parsed = plugin.for && Plugin.dependencyParse(plugin.for);
        return !plugin.for || (module.name === parsed.name && Plugin.versionSatisfies(module.version, parsed.range));
    };

    /**
     * Instala los complementos llamando a `plugin.install` en cada complemento especificado en `complementos` si se pasa, de lo contrario `module.uses`.
     * Para instalar complementos en `Asunto`, consulte la función de conveniencia `Matter.use`.
     * Los complementos se pueden especificar por su nombre o una referencia al objeto del complemento.
     * Los propios complementos pueden especificar más dependencias, pero cada complemento se instala solo una vez.
     * El orden es importante, se realiza una clasificación topológica para encontrar el mejor orden de instalación resultante.
     * Esta clasificación intenta satisfacer la orden solicitada de cada dependencia, pero puede no ser exacta en todos los casos.
     * Esta función registra el estado resultante de cada dependencia en la consola, junto con las advertencias.
     * - Una marca verde ✅ indica que se resolvió e instaló una dependencia.
     * - Un rombo naranja 🔶 indica que se resolvió una dependencia, pero se emitió una advertencia para ella o una de sus dependencias.
     * - Una cruz roja ❌ indica que no se pudo resolver una dependencia.
     * Evita llamar a esta función varias veces en el mismo módulo a menos que desee controlar manualmente el orden de instalación.
     * @method use - uso
     * @param module {} El módulo instala complementos en.
     * @param [plugins=module.uses] {} Los complementos para instalar en el módulo (opcional, por defecto es `module.uses`).
     */
    Plugin.use = function(module, plugins) {
        module.uses = (module.uses || []).concat(plugins || []);

        if (module.uses.length === 0) {
            Common.warn('Plugin.use:', Plugin.toString(module), 'does not specify any dependencies to install.');
            return;
        }

        var dependencies = Plugin.dependencies(module),
            sortedDependencies = Common.topologicalSort(dependencies),
            status = [];

        for (var i = 0; i < sortedDependencies.length; i += 1) {
            if (sortedDependencies[i] === module.name) {
                continue;
            }

            var plugin = Plugin.resolve(sortedDependencies[i]);

            if (!plugin) {
                status.push('❌ ' + sortedDependencies[i]);
                continue;
            }

            if (Plugin.isUsed(module, plugin.name)) {
                continue;
            }

            if (!Plugin.isFor(plugin, module)) {
                Common.warn('Plugin.use:', Plugin.toString(plugin), 'is for', plugin.for, 'but installed on', Plugin.toString(module) + '.');
                plugin._warned = true;
            }

            if (plugin.install) {
                plugin.install(module);
            } else {
                Common.warn('Plugin.use:', Plugin.toString(plugin), 'does not specify an install function.');
                plugin._warned = true;
            }

            if (plugin._warned) {
                status.push('🔶 ' + Plugin.toString(plugin));
                delete plugin._warned;
            } else {
                status.push('✅ ' + Plugin.toString(plugin));
            }

            module.used.push(plugin.name);
        }

        if (status.length > 0) {
            Common.info(status.join('  '));
        }
    };

    /**
     * Encuentra de forma recursiva todas las dependencias de un módulo y devuelve un gráfico de dependencia plano.
     * @method dependencies - dependencias
     * @param module {} The module. - El módulo
     * @return {object} Un gráfico de dependencia
     */
    Plugin.dependencies = function(module, tracked) {
        var parsedBase = Plugin.dependencyParse(module),
            name = parsedBase.name;

        tracked = tracked || {};

        if (name in tracked) {
            return;
        }

        module = Plugin.resolve(module) || module;

        tracked[name] = Common.map(module.uses || [], function(dependency) {
            if (Plugin.isPlugin(dependency)) {
                Plugin.register(dependency);
            }

            var parsed = Plugin.dependencyParse(dependency),
                resolved = Plugin.resolve(dependency);

            if (resolved && !Plugin.versionSatisfies(resolved.version, parsed.range)) {
                Common.warn(
                    'Plugin.dependencies:', Plugin.toString(resolved), 'does not satisfy',
                    Plugin.toString(parsed), 'used by', Plugin.toString(parsedBase) + '.'
                );

                resolved._warned = true;
                module._warned = true;
            } else if (!resolved) {
                Common.warn(
                    'Plugin.dependencies:', Plugin.toString(dependency), 'used by',
                    Plugin.toString(parsedBase), 'could not be resolved.'
                );

                module._warned = true;
            }

            return parsed.name;
        });

        for (var i = 0; i < tracked[name].length; i += 1) {
            Plugin.dependencies(tracked[name][i], tracked);
        }

        return tracked;
    };

    /**
     * Analiza una cadena de dependencia en sus componentes.
     * La `dependencia` es una cadena con el formato `'module-name'` o `'module-name@version'`.
     * Consulte la documentación de `Plugin.versionParse` para obtener una descripción del formato.
     * Esta función también puede manejar dependencias que ya están resueltas (por ejemplo, un objeto de módulo).
     * @method dependencyParse 
     * @param dependency {string} La dependencia del formato `'module-name'` o `'module-name@version'`.
     * @return {object} La dependencia analizada en sus componentes.
     */
    Plugin.dependencyParse = function(dependency) {
        if (Common.isString(dependency)) {
            var pattern = /^[\w-]+(@(\*|[\^~]?\d+\.\d+\.\d+(-[0-9A-Za-z-]+)?))?$/;

            if (!pattern.test(dependency)) {
                Common.warn('Plugin.dependencyParse:', dependency, 'is not a valid dependency string.');
            }

            return {
                name: dependency.split('@')[0],
                range: dependency.split('@')[1] || '*'
            };
        }

        return {
            name: dependency.name,
            range: dependency.range || dependency.version
        };
    };

    /**
     * Analiza una versión de la cadena en sus componentes.  
     * Las versiones tienen estrictamente el formato `x.y.z` (como en [semver] (http://semver.org/)).
     * Las versiones pueden tener opcionalmente una etiqueta de prelanzamiento en el formato `x.y.z-alpha`.
     * Los rangos son un subconjunto estricto de [rangos npm] (https://docs.npmjs.com/misc/semver#advanced-range-syntax).
     * Solo se admiten los siguientes tipos de rango:
     * - Tilde ranges e.g. `~1.2.3`
     * - Caret ranges e.g. `^1.2.3`
     * - Exact version e.g. `1.2.3`
     * - Any version `*`
     * @method versionParse
     * @param range {string} La cadena de la versión.
     * @return {object}  El rango de versiones analizado en sus componentes.
     */
    Plugin.versionParse = function(range) {
        var pattern = /^\*|[\^~]?\d+\.\d+\.\d+(-[0-9A-Za-z-]+)?$/;

        if (!pattern.test(range)) {
            Common.warn('Plugin.versionParse:', range, 'is not a valid version or range.');
        }

        var identifiers = range.split('-');
        range = identifiers[0];

        var isRange = isNaN(Number(range[0])),
            version = isRange ? range.substr(1) : range,
            parts = Common.map(version.split('.'), function(part) {
                return Number(part);
            });

        return {
            isRange: isRange,
            version: version,
            range: range,
            operator: isRange ? range[0] : '',
            parts: parts,
            prerelease: identifiers[1],
            number: parts[0] * 1e8 + parts[1] * 1e4 + parts[2]
        };
    };

    /**
     * Devuelve `verdadero` si la `versión` satisface el `rango` dado.
     * Consulte la documentación de `Plugin.versionParse` para obtener una descripción del formato.
     * Si no se especifica una versión o rango, se asume que cualquier versión (`*`) cumple.
     * @method versionSatisfies
     * @param version {string} La cadena de versión.
     * @param range {string} La cadena de rango.
     * @return {boolean} `verdadero` si` versión` satisface el `rango`, en caso contrario,` falso`.
     */
    Plugin.versionSatisfies = function(version, range) {
        range = range || '*';

        var rangeParsed = Plugin.versionParse(range),
            rangeParts = rangeParsed.parts,
            versionParsed = Plugin.versionParse(version),
            versionParts = versionParsed.parts;

        if (rangeParsed.isRange) {
            if (rangeParsed.operator === '*' || version === '*') {
                return true;
            }

            if (rangeParsed.operator === '~') {
                return versionParts[0] === rangeParts[0] && versionParts[1] === rangeParts[1] && versionParts[2] >= rangeParts[2];
            }

            if (rangeParsed.operator === '^') {
                if (rangeParts[0] > 0) {
                    return versionParts[0] === rangeParts[0] && versionParsed.number >= rangeParsed.number;
                }

                if (rangeParts[1] > 0) {
                    return versionParts[1] === rangeParts[1] && versionParts[2] >= rangeParts[2];
                }

                return versionParts[2] === rangeParts[2];
            }
        }

        return version === range || version === '*';
    };

})();

},{"./Common":14}],21:[function(_dereq_,module,exports){
/**
* El módulo `Matter.Runner` es una utilidad opcional que proporciona un bucle de juego,
* que maneja la actualización continua de un `Matter.Engine` para ti dentro de un navegador.
* Está diseñado para fines de desarrollo y depuración, pero también puede ser adecuado para juegos simples.
* Si estás usando tu propio bucle de juego, entonces no necesitas el módulo `Matter.Runner`.
* En su lugar, simplemente llame a `Engine.update (engine, delta)` en su propio bucle.
*
* Ve el uso incluido [ejemplos](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Runner
*/

var Runner = {};

module.exports = Runner;

var Events = _dereq_('./Events');
var Engine = _dereq_('./Engine');
var Common = _dereq_('./Common');

(function() {

    var _requestAnimationFrame,
        _cancelAnimationFrame;

    if (typeof window !== 'undefined') {
        _requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame
                                      || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
   
        _cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame 
                                      || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;
    }

    if (!_requestAnimationFrame) {
        var _frameTimeout;

        _requestAnimationFrame = function(callback){ 
            _frameTimeout = setTimeout(function() { 
                callback(Common.now()); 
            }, 1000 / 60);
        };

        _cancelAnimationFrame = function() {
            clearTimeout(_frameTimeout);
        };
    }

    /**
     * Crea un nuevo corredor. El parámetro de opciones es un objeto que especifica las propiedades que desea anular los valores predeterminados.
     * @method create - crear
     * @param {} options - opciones
     */
    Runner.create = function(options) {
        var defaults = {
            fps: 60,
            correction: 1,
            deltaSampleSize: 60,
            counterTimestamp: 0,
            frameCounter: 0,
            deltaHistory: [],
            timePrev: null,
            timeScalePrev: 1,
            frameRequestId: null,
            isFixed: false,
            enabled: true
        };

        var runner = Common.extend(defaults, options);

        runner.delta = runner.delta || 1000 / runner.fps;
        runner.deltaMin = runner.deltaMin || 1000 / runner.fps;
        runner.deltaMax = runner.deltaMax || 1000 / (runner.fps * 0.5);
        runner.fps = 1000 / runner.delta;

        return runner;
    };

    /**
     * Marca continuamente un `Matter.Engine` llamando a` Runner.tick `en el evento `requestAnimationFrame`.
     * @method run - reproducir
     * @param {engine} engine - motor
     */
    Runner.run = function(runner, engine) {
        // crear corredor si el motor es el primer argumento
        if (typeof runner.positionIterations !== 'undefined') {
            engine = runner;
            runner = Runner.create();
        }

        (function render(time){
            runner.frameRequestId = _requestAnimationFrame(render);

            if (time && runner.enabled) {
                Runner.tick(runner, engine, time);
            }
        })();

        return runner;
    };

    /**
     * Una utilidad de bucle de juego que actualiza el motor y el renderizador en un paso (un 'tick').
     * Presenta suavizado delta, corrección de tiempo y sincronización fija o dinámica.
     * Activa los eventos `beforeTick`,` tick` y `afterTick` en el motor.
     * Considere solo `Engine.update (engine, delta)` si está usando su propio bucle.
     * @method tick
     * @param {runner} runner - reproductor
     * @param {engine} engine - motor
     * @param {number} time - tiempo
     */
    Runner.tick = function(runner, engine, time) {
        var timing = engine.timing,
            correction = 1,
            delta;

        // crea un objeto de evento
        var event = {
            timestamp: timing.timestamp
        };

        Events.trigger(runner, 'beforeTick', event);
        Events.trigger(engine, 'beforeTick', event); // @deprecated

        if (runner.isFixed) {
            // paso de tiempo fijo
            delta = runner.delta;
        } else {
            // intervalo de tiempo dinámico basado en el reloj de pared entre llamadas
            delta = (time - runner.timePrev) || runner.delta;
            runner.timePrev = time;

            // Filtrar delta de forma optimista en unos pocos fotogramas para mejorar la estabilidad.
            runner.deltaHistory.push(delta);
            runner.deltaHistory = runner.deltaHistory.slice(-runner.deltaSampleSize);
            delta = Math.min.apply(null, runner.deltaHistory);
            
            // límite delta
            delta = delta < runner.deltaMin ? runner.deltaMin : delta;
            delta = delta > runner.deltaMax ? runner.deltaMax : delta;

            // corrección para delta
            correction = delta / runner.delta;

            // actualizar el objeto de sincronización del motor
            runner.delta = delta;
        }

        // corrección de tiempo para escalar el tiempo
        if (runner.timeScalePrev !== 0)
            correction *= timing.timeScale / runner.timeScalePrev;

        if (timing.timeScale === 0)
            correction = 0;

        runner.timeScalePrev = timing.timeScale;
        runner.correction = correction;

        // contador de fps
        runner.frameCounter += 1;
        if (time - runner.counterTimestamp >= 1000) {
            runner.fps = runner.frameCounter * ((time - runner.counterTimestamp) / 1000);
            runner.counterTimestamp = time;
            runner.frameCounter = 0;
        }

        Events.trigger(runner, 'tick', event);
        Events.trigger(engine, 'tick', event); // @deprecated

        // si se ha modificado el mundo, borre el gráfico de escena de renderizado
        if (engine.world.isModified 
            && engine.render
            && engine.render.controller
            && engine.render.controller.clear) {
            engine.render.controller.clear(engine.render); // @deprecated
        }

        // actualización
        Events.trigger(runner, 'beforeUpdate', event);
        Engine.update(engine, delta, correction);
        Events.trigger(runner, 'afterUpdate', event);

        // renderizar
        // @deprecated
        if (engine.render && engine.render.controller) {
            Events.trigger(runner, 'beforeRender', event);
            Events.trigger(engine, 'beforeRender', event); // @deprecated

            engine.render.controller.world(engine.render);

            Events.trigger(runner, 'afterRender', event);
            Events.trigger(engine, 'afterRender', event); // @deprecated
        }

        Events.trigger(runner, 'afterTick', event);
        Events.trigger(engine, 'afterTick', event); // @deprecated
    };

    /**
     * Finaliza la ejecución de `Runner.run` en el `runner` dado, cancelando el bucle de evento de solicitud de cuadro de animación.
     * Si solo deseas pausar el motor temporalmente, consulta `engine.enabled` en su lugar.
     * @method stop - detener
     * @param {runner} runner - reproductor
     */
    Runner.stop = function(runner) {
        _cancelAnimationFrame(runner.frameRequestId);
    };

    /**
     * Alias de `Runner.run`.
     * @method start - iniciar
     * @param {runner} runner - reproductor
     * @param {engine} engine - motor
     */
    Runner.start = function(runner, engine) {
        Runner.run(runner, engine);
    };

    /*
    *
    *  Documentación de eventos
    *
    */

    /**
    * Se dispara al inicio de un tick, antes de cualquier actualización del motor o la sincronización
    *
    * @event beforeTick - antesdeTick
    * @param {} event Un objeto de evento
    * @param {number} event.timestamp El engine.timing.timestamp del evento
    * @param {} event.source El objeto fuente del evento
    * @param {} event.name El nombre del evento
    */

    /**
    * Se dispara después de actualizar la sincronización del motor, pero justo antes de la actualización
    *
    * @event tick
    * @param {} event Un objeto de evento
    * @param {number} event.timestamp El engine.timing.timestamp del evento
    * @param {} event.source El objeto fuente del evento
    * @param {} event.name El nombre del evento
    */

    /**
    * Se activa al final de un tick, después de la actualización del motor y después del renderizado
    *
    * @event afterTick
    * @param {} event Un objeto de evento
    * @param {number} event.timestamp El engine.timing.timestamp del evento
    * @param {} event.source El objeto fuente del evento
    * @param {} event.name El nombre del evento
    */

    /**
    * Disparado antes de la actualización
    *
    * @event beforeUpdate - antesdelaactualización
    * @param {} event Un objeto de evento
    * @param {number} event.timestamp El engine.timing.timestamp del evento
    * @param {} event.source El objeto fuente del evento
    * @param {} event.name El nombre del evento
    */

    /**
    * Lanzado después de la actualización
    *
    * @event afterUpdate - despuésdelaactualización
    * @param {} event Un objeto de evento
    * @param {number} event.timestamp El engine.timing.timestamp del evento
    * @param {} event.source El objeto fuente del evento
    * @param {} event.name El nombre del evento
    */

    /**
    * Disparado antes de renderizar
    *
    * @event beforeRender - antesdereproducir
    * @param {} event Un objeto de evento
    * @param {number} event.timestamp El engine.timing.timestamp del evento
    * @param {} event.source El objeto fuente del evento
    * @param {} event.name El nombre del evento
    * @deprecated
    */

    /**
    * Disparado después del renderizado
    *
    * @event afterRender 
    * @param {} event Un objeto de evento
    * @param {number} event.timestamp El engine.timing.timestamp del evento
    * @param {} event.source El objeto fuente del evento
    * @param {} event.name El nombre del evento
    * @deprecated
    */

    /*
    *
    *  Documentación de propiedades
    *
    */

    /**
     * Una marca que especifica si el corredor está corriendo o no.
     *
     * @property enabled -activado
     * @type boolean - booleano
     * @default true - verdadero
     */

    /**
     *Un `Booleano` que especifica si el corredor debe usar un paso de tiempo fijo (de lo contrario, es variable).
     * Si el tiempo es fijo, la velocidad de simulación aparente cambiará dependiendo de la velocidad de fotogramas (pero el comportamiento será determinista).
     * Si el tiempo es variable, entonces la velocidad de simulación aparente será constante (aproximadamente, pero a costa del determininismo).
     *
     * @property isFixed 
     * @type boolean - booleano
     * @default false - falso
     */

    /**
     * Un `Número` que especifica el intervalo de tiempo entre actualizaciones en milisegundos.
     * Si `engine.timing.isFixed` se establece en `true`, entonces `delta` es fijo.
     * Si es 'false', entonces 'delta' puede cambiar dinámicamente para mantener la velocidad de simulación aparente correcta.
     *
     * @property delta
     * @type number - número
     * @default 1000 / 60
     */

})();

},{"./Common":14,"./Engine":15,"./Events":16}],22:[function(_dereq_,module,exports){
/**
* El módulo `Matter.Sleeping` contiene métodos para gestionar el estado de sueño de los cuerpos.
*
* @class Sleeping - Durmiendo
*/

var Sleeping = {};

module.exports = Sleeping;

var Events = _dereq_('./Events');

(function() {

    Sleeping._motionWakeThreshold = 0.18;
    Sleeping._motionSleepThreshold = 0.08;
    Sleeping._minBias = 0.9;

    /**
     * Duerme los cuerpos o los despierta según su movimiento.
     * @method update - actualización
     * @param {body[]} bodies - cuerpos
     * @param {number} timeScale
     */ 
    Sleeping.update = function(bodies, timeScale) {
        var timeFactor = timeScale * timeScale * timeScale;

        // actualizar el estado del sueño de los cuerpos
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i],
                motion = body.speed * body.speed + body.angularSpeed * body.angularSpeed;

            // Despertar cuerpos si se les aplica una fuerza
            if (body.force.x !== 0 || body.force.y !== 0) {
                Sleeping.set(body, false);
                continue;
            }

            var minMotion = Math.min(body.motion, motion),
                maxMotion = Math.max(body.motion, motion);
        
            // estimación de movimiento medio sesgada entre fotogramas
            body.motion = Sleeping._minBias * minMotion + (1 - Sleeping._minBias) * maxMotion;
            
            if (body.sleepThreshold > 0 && body.motion < Sleeping._motionSleepThreshold * timeFactor) {
                body.sleepCounter += 1;
                
                if (body.sleepCounter >= body.sleepThreshold)
                    Sleeping.set(body, true);
            } else if (body.sleepCounter > 0) {
                body.sleepCounter -= 1;
            }
        }
    };

    /**
     * Dado un conjunto de pares que chocan, despierta los cuerpos dormidos involucrados.
     * @method afterCollisions 
     * @param {pair[]} pairs - pares
     * @param {number} timeScale 
     */
    Sleeping.afterCollisions = function(pairs, timeScale) {
        var timeFactor = timeScale * timeScale * timeScale;

        // Despertar cuerpos involucrados en colisiones.
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i];
            
            // no despiertes parejas inactivas
            if (!pair.isActive)
                continue;

            var collision = pair.collision,
                bodyA = collision.bodyA.parent, 
                bodyB = collision.bodyB.parent;
        
            // no despiertes si al menos un cuerpo está estático
            if ((bodyA.isSleeping && bodyB.isSleeping) || bodyA.isStatic || bodyB.isStatic)
                continue;
        
            if (bodyA.isSleeping || bodyB.isSleeping) {
                var sleepingBody = (bodyA.isSleeping && !bodyA.isStatic) ? bodyA : bodyB,
                    movingBody = sleepingBody === bodyA ? bodyB : bodyA;

                if (!sleepingBody.isStatic && movingBody.motion > Sleeping._motionWakeThreshold * timeFactor) {
                    Sleeping.set(sleepingBody, false);
                }
            }
        }
    };
  
    /**
     * Establece un cuerpo como dormido o despierto.
     * @method set - fijar
     * @param {body} body - cuerpo
     * @param {boolean} isSleeping 
     */
    Sleeping.set = function(body, isSleeping) {
        var wasSleeping = body.isSleeping;

        if (isSleeping) {
            body.isSleeping = true;
            body.sleepCounter = body.sleepThreshold;

            body.positionImpulse.x = 0;
            body.positionImpulse.y = 0;

            body.positionPrev.x = body.position.x;
            body.positionPrev.y = body.position.y;

            body.anglePrev = body.angle;
            body.speed = 0;
            body.angularSpeed = 0;
            body.motion = 0;

            if (!wasSleeping) {
                Events.trigger(body, 'sleepStart');
            }
        } else {
            body.isSleeping = false;
            body.sleepCounter = 0;

            if (wasSleeping) {
                Events.trigger(body, 'sleepEnd');
            }
        }
    };

})();

},{"./Events":16}],23:[function(_dereq_,module,exports){
(function (global){
/**
* El módulo `Matter.Bodies` contiene métodos de fábrica para crear modelos de cuerpos rígidos
* con configuraciones de cuerpo de uso común (como rectángulos, círculos y otros polígonos).
*
* Ve el uso incluido [ejemplos](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Bodies - Cuerpos
*/

// TODO: verdaderos cuerpos circulares

var Bodies = {};

module.exports = Bodies;

var Vertices = _dereq_('../geometry/Vertices');
var Common = _dereq_('../core/Common');
var Body = _dereq_('../body/Body');
var Bounds = _dereq_('../geometry/Bounds');
var Vector = _dereq_('../geometry/Vector');
var decomp = (typeof window !== "undefined" ? window['decomp'] : typeof global !== "undefined" ? global['decomp'] : null);

(function() {

    /**
     * Crea un nuevo modelo de cuerpo rígido con un envolvente rectangular. 
     * El parámetro de opciones es un objeto que especifica las propiedades que desea anular los valores predeterminados.
     * Consulte la sección de propiedades del módulo `Matter.Body` para obtener información detallada sobre lo que puede pasar a través del objeto `options`.
     * @method rectangle - rectangulo
     * @param {number} x
     * @param {number} y
     * @param {number} width - ancho
     * @param {number} height - altura
     * @param {object} [options] 
     * @return {body}  Un nuevo cuerpo rectangular
     */
    Bodies.rectangle = function(x, y, width, height, options) {
        options = options || {};

        var rectangle = { 
            label: 'Rectangle Body',
            position: { x: x, y: y },
            vertices: Vertices.fromPath('L 0 0 L ' + width + ' 0 L ' + width + ' ' + height + ' L 0 ' + height)
        };

        if (options.chamfer) {
            var chamfer = options.chamfer;
            rectangle.vertices = Vertices.chamfer(rectangle.vertices, chamfer.radius, 
                                    chamfer.quality, chamfer.qualityMin, chamfer.qualityMax);
            delete options.chamfer;
        }

        return Body.create(Common.extend({}, rectangle, options));
    };
    
    /**
     * Crea un nuevo modelo de carrocería rígida con envolvente trapezoidal. 
     * El parámetro de opciones es un objeto que especifica las propiedades que desea anular los valores predeterminados.
     * Consulte la sección de propiedades del módulo `Matter.Body` para obtener información detallada sobre lo que puede pasar a través del objeto `options`.
     * @method trapezoid - trapezoide
     * @param {number} x
     * @param {number} y
     * @param {number} width - ancho
     * @param {number} height - altura
     * @param {number} slope - inclinación
     * @param {object} [options]
     * @return {body}  Un nuevo cuerpo trapezoidal
     */
    Bodies.trapezoid = function(x, y, width, height, slope, options) {
        options = options || {};

        slope *= 0.5;
        var roof = (1 - (slope * 2)) * width;
        
        var x1 = width * slope,
            x2 = x1 + roof,
            x3 = x2 + x1,
            verticesPath;

        if (slope < 0.5) {
            verticesPath = 'L 0 0 L ' + x1 + ' ' + (-height) + ' L ' + x2 + ' ' + (-height) + ' L ' + x3 + ' 0';
        } else {
            verticesPath = 'L 0 0 L ' + x2 + ' ' + (-height) + ' L ' + x3 + ' 0';
        }

        var trapezoid = { 
            label: 'Trapezoid Body',
            position: { x: x, y: y },
            vertices: Vertices.fromPath(verticesPath)
        };

        if (options.chamfer) {
            var chamfer = options.chamfer;
            trapezoid.vertices = Vertices.chamfer(trapezoid.vertices, chamfer.radius, 
                                    chamfer.quality, chamfer.qualityMin, chamfer.qualityMax);
            delete options.chamfer;
        }

        return Body.create(Common.extend({}, trapezoid, options));
    };

    /**
     * Crea un nuevo modelo de cuerpo rígido con un envolvente circular.
     * El parámetro de opciones es un objeto que especifica las propiedades que desea anular los valores predeterminados.
     * Consulte la sección de propiedades del módulo `Matter.Body` para obtener información detallada sobre lo que puede pasar a través del objeto `options`.
     * @method circle - circulo
     * @param {number} x
     * @param {number} y
     * @param {number} radius - radio
     * @param {object} [options]
     * @param {number} [maxSides]
     * @return {body} Un nuevo cuerpo circular
     */
    Bodies.circle = function(x, y, radius, options, maxSides) {
        options = options || {};

        var circle = {
            label: 'Circle Body',
            circleRadius: radius
        };
        
        // círculos aproximados con polígonos hasta círculos verdaderos implementados en SAT
        maxSides = maxSides || 25;
        var sides = Math.ceil(Math.max(10, Math.min(maxSides, radius)));

        // optimización: utilice siempre un número par de lados (la mitad del número de ejes únicos)
        if (sides % 2 === 1)
            sides += 1;

        return Bodies.polygon(x, y, sides, radius, Common.extend({}, circle, options));
    };

    /**
     * Crea un nuevo modelo de cuerpo rígido con un envolvente poligonal regular con el número dado de lados.
     * El parámetro de opciones es un objeto que especifica las propiedades que desea anular los valores predeterminados.
     * Consulte la sección de propiedades del módulo `Matter.Body` para obtener información detallada sobre lo que puede pasar a través del objeto `options`.
     * @method polygon - polígono
     * @param {number} x
     * @param {number} y
     * @param {number} sides - lados
     * @param {number} radius - radios
     * @param {object} [options]
     * @return {body} Un nuevo cuerpo de polígono regular
     */
    Bodies.polygon = function(x, y, sides, radius, options) {
        options = options || {};

        if (sides < 3)
            return Bodies.circle(x, y, radius, options);

        var theta = 2 * Math.PI / sides,
            path = '',
            offset = theta * 0.5;

        for (var i = 0; i < sides; i += 1) {
            var angle = offset + (i * theta),
                xx = Math.cos(angle) * radius,
                yy = Math.sin(angle) * radius;

            path += 'L ' + xx.toFixed(3) + ' ' + yy.toFixed(3) + ' ';
        }

        var polygon = { 
            label: 'Polygon Body',
            position: { x: x, y: y },
            vertices: Vertices.fromPath(path)
        };

        if (options.chamfer) {
            var chamfer = options.chamfer;
            polygon.vertices = Vertices.chamfer(polygon.vertices, chamfer.radius, 
                                    chamfer.quality, chamfer.qualityMin, chamfer.qualityMax);
            delete options.chamfer;
        }

        return Body.create(Common.extend({}, polygon, options));
    };

    /**
     * Crea un cuerpo utilizando los vértices proporcionados (o una matriz que contiene varios conjuntos de vértices).
     * Si los vértices son convexos, pasarán como se vayan suministrando.
     * De lo contrario, si los vértices son cóncavos, se descompondrán si [poly-decomp.js] (https://github.com/schteppe/poly-decomp.js) está disponible.
     * Tenga en cuenta que no se garantiza que este proceso admita conjuntos complejos de vértices (por ejemplo, aquellos con agujeros pueden fallar).
     * De forma predeterminada, la descomposición descartará los bordes colineales (para mejorar el rendimiento).
     * También puede descartar opcionalmente cualquier parte que tenga un área menor que 'área mínima'.
     * Si los vértices no se pueden descomponer, el resultado volverá a utilizar el envolvente convexo.
     * El parámetro de opciones es un objeto que especifica cualquier propiedad de `Matter.Body` que desea anular los valores predeterminados.
     * Consulte la sección de propiedades del módulo `Matter.Body` para obtener información detallada sobre lo que puede pasar a través del objeto `options`.
     * @method fromVertices
     * @param {number} x
     * @param {number} y
     * @param [[vector]] vertexSets
     * @param {object} [options]
     * @param {bool} [flagInternal=false]
     * @param {number} [removeCollinear=0.01]
     * @param {number} [minimumArea=10]
     * @return {body}
     */
    Bodies.fromVertices = function(x, y, vertexSets, options, flagInternal, removeCollinear, minimumArea) {
        var body,
            parts,
            isConvex,
            vertices,
            i,
            j,
            k,
            v,
            z;

        options = options || {};
        parts = [];

        flagInternal = typeof flagInternal !== 'undefined' ? flagInternal : false;
        removeCollinear = typeof removeCollinear !== 'undefined' ? removeCollinear : 0.01;
        minimumArea = typeof minimumArea !== 'undefined' ? minimumArea : 10;

        if (!decomp) {
            Common.warn('Bodies.fromVertices: poly-decomp.js required. Could not decompose vertices. Fallback to convex hull.');
        }

        // asegúrese de que los conjuntos de vértices sean una matriz de matrices
        if (!Common.isArray(vertexSets[0])) {
            vertexSets = [vertexSets];
        }

        for (v = 0; v < vertexSets.length; v += 1) {
            vertices = vertexSets[v];
            isConvex = Vertices.isConvex(vertices);

            if (isConvex || !decomp) {
                if (isConvex) {
                    vertices = Vertices.clockwiseSort(vertices);
                } else {
                    // retroceso al envolvente convexo cuando la descomposición no es posible
                    vertices = Vertices.hull(vertices);
                }

                parts.push({
                    position: { x: x, y: y },
                    vertices: vertices
                });
            } else {
                // inicializar una descomposición
                var concave = vertices.map(function(vertex) {
                    return [vertex.x, vertex.y];
                });

                // los vértices son cóncavos y simples, podemos descomponerlos en partes
                decomp.makeCCW(concave);
                if (removeCollinear !== false)
                    decomp.removeCollinearPoints(concave, removeCollinear);

                // utilizar el algoritmo de descomposición rápida (Bayazit)
                var decomposed = decomp.quickDecomp(concave);

                // por cada trozo descompuesto
                for (i = 0; i < decomposed.length; i++) {
                    var chunk = decomposed[i];

                    // convertir vértices en la estructura correcta
                    var chunkVertices = chunk.map(function(vertices) {
                        return {
                            x: vertices[0],
                            y: vertices[1]
                        };
                    });

                    // omitir trozos pequeños
                    if (minimumArea > 0 && Vertices.area(chunkVertices) < minimumArea)
                        continue;

                    // crea una pieza compuesta
                    parts.push({
                        position: Vertices.centre(chunkVertices),
                        vertices: chunkVertices
                    });
                }
            }
        }

        // crear partes del cuerpo
        for (i = 0; i < parts.length; i++) {
            parts[i] = Body.create(Common.extend(parts[i], options));
        }

        // marcar bordes internos (bordes de partes coincidentes)
        if (flagInternal) {
            var coincident_max_dist = 5;

            for (i = 0; i < parts.length; i++) {
                var partA = parts[i];

                for (j = i + 1; j < parts.length; j++) {
                    var partB = parts[j];

                    if (Bounds.overlaps(partA.bounds, partB.bounds)) {
                        var pav = partA.vertices,
                            pbv = partB.vertices;

                        // iterar vértices de ambas partes
                        for (k = 0; k < partA.vertices.length; k++) {
                            for (z = 0; z < partB.vertices.length; z++) {
                                // find distances between the vertices
                                var da = Vector.magnitudeSquared(Vector.sub(pav[(k + 1) % pav.length], pbv[z])),
                                    db = Vector.magnitudeSquared(Vector.sub(pav[k], pbv[(z + 1) % pbv.length]));

                                // si ambos vértices están muy cerca, considere el borde concidente (interno)
                                if (da < coincident_max_dist && db < coincident_max_dist) {
                                    pav[k].isInternal = true;
                                    pbv[z].isInternal = true;
                                }
                            }
                        }

                    }
                }
            }
        }

        if (parts.length > 1) {
            // crear el cuerpo principal que se devolverá, que contiene partes compuestas generadas
            body = Body.create(Common.extend({ parts: parts.slice(0) }, options));
            Body.setPosition(body, { x: x, y: y });

            return body;
        } else {
            return parts[0];
        }
    };

})();

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../body/Body":1,"../core/Common":14,"../geometry/Bounds":26,"../geometry/Vector":28,"../geometry/Vertices":29}],24:[function(_dereq_,module,exports){
/**
* El módulo `Matter.Composites` contiene métodos de fábrica para crear cuerpos compuestos
* con configuraciones de uso común (como pilas y cadenas).
*
* Ver el uso incluido [ejemplos](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Composites - Composición
*/

var Composites = {};

module.exports = Composites;

var Composite = _dereq_('../body/Composite');
var Constraint = _dereq_('../constraint/Constraint');
var Common = _dereq_('../core/Common');
var Body = _dereq_('../body/Body');
var Bodies = _dereq_('./Bodies');

(function() {

    /**
     * Cree un nuevo compuesto que contenga cuerpos creados en la devolución de llamada en una disposición de cuadrícula.
     * Esta función utiliza los límites del cuerpo para evitar superposiciones.
     * @method stack - pila
     * @param {number} xx
     * @param {number} yy
     * @param {number} columns - columnas
     * @param {number} rows - filas
     * @param {number} columnGap
     * @param {number} rowGap 
     * @param {function} callback 
     * @return {composite} Un nuevo compuesto que contiene objetos creados en la llamada de vuelta.
     */
    Composites.stack = function(xx, yy, columns, rows, columnGap, rowGap, callback) {
        var stack = Composite.create({ label: 'Stack' }),
            x = xx,
            y = yy,
            lastBody,
            i = 0;

        for (var row = 0; row < rows; row++) {
            var maxHeight = 0;
            
            for (var column = 0; column < columns; column++) {
                var body = callback(x, y, column, row, lastBody, i);
                    
                if (body) {
                    var bodyHeight = body.bounds.max.y - body.bounds.min.y,
                        bodyWidth = body.bounds.max.x - body.bounds.min.x; 

                    if (bodyHeight > maxHeight)
                        maxHeight = bodyHeight;
                    
                    Body.translate(body, { x: bodyWidth * 0.5, y: bodyHeight * 0.5 });

                    x = body.bounds.max.x + columnGap;

                    Composite.addBody(stack, body);
                    
                    lastBody = body;
                    i += 1;
                } else {
                    x += columnGap;
                }
            }
            
            y += maxHeight + rowGap;
            x = xx;
        }

        return stack;
    };
    
    /**
     * Encadena todos los sólidos del compuesto dado mediante restricciones.
     * @method chain - cadena
     * @param {composite} composite - compuesto
     * @param {number} xOffsetA
     * @param {number} yOffsetA
     * @param {number} xOffsetB
     * @param {number} yOffsetB
     * @param {object} options - opciones
     * @return {composite} Un nuevo compuesto que contiene objetos encadenados con restricciones.
     */
    Composites.chain = function(composite, xOffsetA, yOffsetA, xOffsetB, yOffsetB, options) {
        var bodies = composite.bodies;
        
        for (var i = 1; i < bodies.length; i++) {
            var bodyA = bodies[i - 1],
                bodyB = bodies[i],
                bodyAHeight = bodyA.bounds.max.y - bodyA.bounds.min.y,
                bodyAWidth = bodyA.bounds.max.x - bodyA.bounds.min.x, 
                bodyBHeight = bodyB.bounds.max.y - bodyB.bounds.min.y,
                bodyBWidth = bodyB.bounds.max.x - bodyB.bounds.min.x;
        
            var defaults = {
                bodyA: bodyA,
                pointA: { x: bodyAWidth * xOffsetA, y: bodyAHeight * yOffsetA },
                bodyB: bodyB,
                pointB: { x: bodyBWidth * xOffsetB, y: bodyBHeight * yOffsetB }
            };
            
            var constraint = Common.extend(defaults, options);
        
            Composite.addConstraint(composite, Constraint.create(constraint));
        }

        composite.label += ' Chain';
        
        return composite;
    };

    /**
     * Conecta sólidos en el compuesto con restricciones en un patrón de cuadrícula, con riostras opcionales.
     * @method mesh - malla
     * @param {composite} composite - compuesto
     * @param {number} columns - columnas
     * @param {number} rows - filas
     * @param {boolean} crossBrace 
     * @param {object} options - opciones
     * @return {composite} El compuesto que contiene los objetos entrelazados con restricciones.
     */
    Composites.mesh = function(composite, columns, rows, crossBrace, options) {
        var bodies = composite.bodies,
            row,
            col,
            bodyA,
            bodyB,
            bodyC;
        
        for (row = 0; row < rows; row++) {
            for (col = 1; col < columns; col++) {
                bodyA = bodies[(col - 1) + (row * columns)];
                bodyB = bodies[col + (row * columns)];
                Composite.addConstraint(composite, Constraint.create(Common.extend({ bodyA: bodyA, bodyB: bodyB }, options)));
            }

            if (row > 0) {
                for (col = 0; col < columns; col++) {
                    bodyA = bodies[col + ((row - 1) * columns)];
                    bodyB = bodies[col + (row * columns)];
                    Composite.addConstraint(composite, Constraint.create(Common.extend({ bodyA: bodyA, bodyB: bodyB }, options)));

                    if (crossBrace && col > 0) {
                        bodyC = bodies[(col - 1) + ((row - 1) * columns)];
                        Composite.addConstraint(composite, Constraint.create(Common.extend({ bodyA: bodyC, bodyB: bodyB }, options)));
                    }

                    if (crossBrace && col < columns - 1) {
                        bodyC = bodies[(col + 1) + ((row - 1) * columns)];
                        Composite.addConstraint(composite, Constraint.create(Common.extend({ bodyA: bodyC, bodyB: bodyB }, options)));
                    }
                }
            }
        }

        composite.label += ' Mesh';
        
        return composite;
    };
    
    /**
     * Crea un nuevo compuesto que contenga cuerpos creados en la llamada de vuelta en una disposición piramidal.
     * Esta función utiliza los límites del cuerpo para evitar superposiciones.
     * @method pyramid - pirámide
     * @param {number} xx
     * @param {number} yy
     * @param {number} columns - columnas
     * @param {number} rows - filas
     * @param {number} columnGap 
     * @param {number} rowGap 
     * @param {function} callback 
     * @return {composite} Un nuevo compuesto que contiene objetos creados en la llamada de vuelta.
     */
    Composites.pyramid = function(xx, yy, columns, rows, columnGap, rowGap, callback) {
        return Composites.stack(xx, yy, columns, rows, columnGap, rowGap, function(x, y, column, row, lastBody, i) {
            var actualRows = Math.min(rows, Math.ceil(columns / 2)),
                lastBodyWidth = lastBody ? lastBody.bounds.max.x - lastBody.bounds.min.x : 0;
            
            if (row > actualRows)
                return;
            
            // orden inverso de las filas
            row = actualRows - row;
            
            var start = row,
                end = columns - 1 - row;

            if (column < start || column > end)
                return;
            
            // Fijar retroactivamente la posición del primer cuerpo, ya que se desconocía el ancho.
            if (i === 1) {
                Body.translate(lastBody, { x: (column + (columns % 2 === 1 ? 1 : -1)) * lastBodyWidth, y: 0 });
            }

            var xOffset = lastBody ? column * lastBodyWidth : 0;
            
            return callback(xx + xOffset + column * columnGap, y, column, row, lastBody, i);
        });
    };

    /**
     * Crea un compuesto con una configuración de Newton's Cradle de cuerpos y restricciones.
     * @method newtonsCradle
     * @param {number} xx
     * @param {number} yy
     * @param {number} number - número
     * @param {number} size - tamaño
     * @param {number} length - largo
     * @return {composite} Un nuevo cuerpo compuesto de newtonsCradle
     */
    Composites.newtonsCradle = function(xx, yy, number, size, length) {
        var newtonsCradle = Composite.create({ label: 'Newtons Cradle' });

        for (var i = 0; i < number; i++) {
            var separation = 1.9,
                circle = Bodies.circle(xx + i * (size * separation), yy + length, size, 
                            { inertia: Infinity, restitution: 1, friction: 0, frictionAir: 0.0001, slop: 1 }),
                constraint = Constraint.create({ pointA: { x: xx + i * (size * separation), y: yy }, bodyB: circle });

            Composite.addBody(newtonsCradle, circle);
            Composite.addConstraint(newtonsCradle, constraint);
        }

        return newtonsCradle;
    };
    
    /**
     * Crea un compuesto con una configuración simple de carrocerías y restricciones.
     * @method car - vehículo
     * @param {number} xx
     * @param {number} yy
     * @param {number} width - ancho
     * @param {number} height - alto
     * @param {number} wheelSize 
     * @return {composite} Un nuevo cuerpo compuesto al vehículo
     */
    Composites.car = function(xx, yy, width, height, wheelSize) {
        var group = Body.nextGroup(true),
            wheelBase = -20,
            wheelAOffset = -width * 0.5 + wheelBase,
            wheelBOffset = width * 0.5 - wheelBase,
            wheelYOffset = 0;
    
        var car = Composite.create({ label: 'Car' }),
            body = Bodies.trapezoid(xx, yy, width, height, 0.3, { 
                collisionFilter: {
                    group: group
                },
                friction: 0.01,
                chamfer: {
                    radius: 10
                }
            });
    
        var wheelA = Bodies.circle(xx + wheelAOffset, yy + wheelYOffset, wheelSize, { 
            collisionFilter: {
                group: group
            },
            friction: 0.8,
            density: 0.01
        });
                    
        var wheelB = Bodies.circle(xx + wheelBOffset, yy + wheelYOffset, wheelSize, { 
            collisionFilter: {
                group: group
            },
            friction: 0.8,
            density: 0.01
        });
                    
        var axelA = Constraint.create({
            bodyA: body,
            pointA: { x: wheelAOffset, y: wheelYOffset },
            bodyB: wheelA,
            stiffness: 0.2,
            render: {
                lineWidth: 0
            }
        });
                        
        var axelB = Constraint.create({
            bodyA: body,
            pointA: { x: wheelBOffset, y: wheelYOffset },
            bodyB: wheelB,
            stiffness: 0.2,
            render: {
                lineWidth: 0
            }
        });
        
        Composite.addBody(car, body);
        Composite.addBody(car, wheelA);
        Composite.addBody(car, wheelB);
        Composite.addConstraint(car, axelA);
        Composite.addConstraint(car, axelB);

        return car;
    };

    /**
     * Crea un cuerpo suave simple como un objeto.
     * @method softBody 
     * @param {number} xx
     * @param {number} yy
     * @param {number} columns - columnas
     * @param {number} rows - filas
     * @param {number} columnGap
     * @param {number} rowGap 
     * @param {boolean} crossBrace 
     * @param {number} particleRadius 
     * @param {} particleOptions
     * @param {} constraintOptions 
     * @return {composite} Un nuevo cuerpo compuesto blando
     */
    Composites.softBody = function(xx, yy, columns, rows, columnGap, rowGap, crossBrace, particleRadius, particleOptions, constraintOptions) {
        particleOptions = Common.extend({ inertia: Infinity }, particleOptions);
        constraintOptions = Common.extend({ stiffness: 0.4 }, constraintOptions);

        var softBody = Composites.stack(xx, yy, columns, rows, columnGap, rowGap, function(x, y) {
            return Bodies.circle(x, y, particleRadius, particleOptions);
        });

        Composites.mesh(softBody, columns, rows, crossBrace, constraintOptions);

        softBody.label = 'Soft Body';

        return softBody;
    };

})();

},{"../body/Body":1,"../body/Composite":2,"../constraint/Constraint":12,"../core/Common":14,"./Bodies":23}],25:[function(_dereq_,module,exports){
/**
* El módulo `Matter.Axes` contiene métodos para crear y manipular conjuntos de ejes.
*
* @class Axes - ejes
*/

var Axes = {};

module.exports = Axes;

var Vector = _dereq_('../geometry/Vector');
var Common = _dereq_('../core/Common');

(function() {

    /**
     * Crea un nuevo conjunto de ejes a partir de los vértices dados.
     * @method fromVertices 
     * @param {vertices} vertices - vértices
     * @return {axes} Nuevos ejes de los vértices dados.
     */
    Axes.fromVertices = function(vertices) {
        var axes = {};

        // encuentra los ejes únicos, usando gradientes normales de borde
        for (var i = 0; i < vertices.length; i++) {
            var j = (i + 1) % vertices.length, 
                normal = Vector.normalise({ 
                    x: vertices[j].y - vertices[i].y, 
                    y: vertices[i].x - vertices[j].x
                }),
                gradient = (normal.y === 0) ? Infinity : (normal.x / normal.y);
            
            // limitar la precisión
            gradient = gradient.toFixed(3).toString();
            axes[gradient] = normal;
        }

        return Common.values(axes);
    };

    /**
     * Gira un conjunto de ejes según el ángulo dado.
     * @method rotate - rotar
     * @param {axes} axes - ejes
     * @param {number} angle - ángulo
     */
    Axes.rotate = function(axes, angle) {
        if (angle === 0)
            return;
        
        var cos = Math.cos(angle),
            sin = Math.sin(angle);

        for (var i = 0; i < axes.length; i++) {
            var axis = axes[i],
                xx;
            xx = axis.x * cos - axis.y * sin;
            axis.y = axis.x * sin + axis.y * cos;
            axis.x = xx;
        }
    };

})();

},{"../core/Common":14,"../geometry/Vector":28}],26:[function(_dereq_,module,exports){
/**
* The `Matter.Bounds` module contains methods for creating and manipulating axis-aligned bounding boxes (AABB).
*
* @class Bounds - Límites
*/

var Bounds = {};

module.exports = Bounds;

(function() {

    /**
     * Crea un nuevo cuadro delimitador alineado con el eje (AABB) para los vértices dados.
     * @method create - crear
     * @param {vertices} vertices - vértices
     * @return {bounds} Un nuevo objeto limites
     */
    Bounds.create = function(vertices) {
        var bounds = { 
            min: { x: 0, y: 0 }, 
            max: { x: 0, y: 0 }
        };

        if (vertices)
            Bounds.update(bounds, vertices);
        
        return bounds;
    };

    /**
     * Actualiza los límites usando los vértices dados y extiende los límites dada una velocidad.
     * @method update - actualización
     * @param {bounds} bounds - límites
     * @param {vertices} vertices - vértices
     * @param {vector} velocity - velocidad
     */
    Bounds.update = function(bounds, vertices, velocity) {
        bounds.min.x = Infinity;
        bounds.max.x = -Infinity;
        bounds.min.y = Infinity;
        bounds.max.y = -Infinity;

        for (var i = 0; i < vertices.length; i++) {
            var vertex = vertices[i];
            if (vertex.x > bounds.max.x) bounds.max.x = vertex.x;
            if (vertex.x < bounds.min.x) bounds.min.x = vertex.x;
            if (vertex.y > bounds.max.y) bounds.max.y = vertex.y;
            if (vertex.y < bounds.min.y) bounds.min.y = vertex.y;
        }
        
        if (velocity) {
            if (velocity.x > 0) {
                bounds.max.x += velocity.x;
            } else {
                bounds.min.x += velocity.x;
            }
            
            if (velocity.y > 0) {
                bounds.max.y += velocity.y;
            } else {
                bounds.min.y += velocity.y;
            }
        }
    };

    /**
     * Devuelve verdadero si los límites contienen el punto dado.
     * @method contains - contiene
     * @param {bounds} bounds - límites	
     * @param {vector} point - punto
     * @return {boolean} Verdadero si los límites contienen el punto; de lo contrario, es falso
     */
    Bounds.contains = function(bounds, point) {
        return point.x >= bounds.min.x && point.x <= bounds.max.x 
               && point.y >= bounds.min.y && point.y <= bounds.max.y;
    };

    /**
     * Devuelve verdadero si los dos límites se cruzan.
     * @method overlaps - superposición
     * @param {bounds} boundsA - límiteA 
     * @param {bounds} boundsB - límiteB
     * @return {boolean} True if the bounds overlap, otherwise false - Verdadero si los límites se superponen; de lo contrario, es falso
     */
    Bounds.overlaps = function(boundsA, boundsB) {
        return (boundsA.min.x <= boundsB.max.x && boundsA.max.x >= boundsB.min.x
                && boundsA.max.y >= boundsB.min.y && boundsA.min.y <= boundsB.max.y);
    };

    /**
     * Traduce los límites por el vector dado.
     * @method translate - trasladar
     * @param {bounds} bounds - límites
     * @param {vector} vector - vector
     */
    Bounds.translate = function(bounds, vector) {
        bounds.min.x += vector.x;
        bounds.max.x += vector.x;
        bounds.min.y += vector.y;
        bounds.max.y += vector.y;
    };

    /**
     * Cambia los límites a la posición dada.
     * @method shift - cambio 
     * @param {bounds} bounds - límites
     * @param {vector} position - posición
     */
    Bounds.shift = function(bounds, position) {
        var deltaX = bounds.max.x - bounds.min.x,
            deltaY = bounds.max.y - bounds.min.y;
            
        bounds.min.x = position.x;
        bounds.max.x = position.x + deltaX;
        bounds.min.y = position.y;
        bounds.max.y = position.y + deltaY;
    };
    
})();

},{}],27:[function(_dereq_,module,exports){
/**
* El módulo `Matter.Svg` contiene métodos para convertir imágenes SVG en una matriz de puntos vectoriales.
*
* Para utilizar este módulo también necesita el SVGPathSeg polyfill: https://github.com/progers/pathseg
*
* Ver el uso incluido [ejemplos](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Svg
*/

var Svg = {};

module.exports = Svg;

var Bounds = _dereq_('../geometry/Bounds');

(function() {

    /**
     * Convierte una ruta SVG en una matriz de puntos vectoriales.
     * Si la ruta de entrada forma una forma cóncava, debe descomponer el resultado en partes convexas antes de usarlo.
     * Consulte `Bodies.fromVertices` que proporciona soporte para esto.
     * Tenga en cuenta que no se garantiza que esta función admita rutas complejas (como las que tienen agujeros).
     * @method pathToVertices e
     * @param {SVGPathElement} path - camino
     * @param {Number} [sampleLength=15]
     * @return {Vector[]} points - puntos
     */
    Svg.pathToVertices = function(path, sampleLength) {
        // https://github.com/wout/svg.topoly.js/blob/master/svg.topoly.js
        var i, il, total, point, segment, segments, 
            segmentsQueue, lastSegment, 
            lastPoint, segmentIndex, points = [],
            lx, ly, length = 0, x = 0, y = 0;

        sampleLength = sampleLength || 15;

        var addPoint = function(px, py, pathSegType) {
            // todos los tipos de ruta impares son relativos excepto PATHSEG_CLOSEPATH (1)
            var isRelative = pathSegType % 2 === 1 && pathSegType > 1;

            // cuando el último punto no es igual al punto actual, agregue el punto actual
            if (!lastPoint || px != lastPoint.x || py != lastPoint.y) {
                if (lastPoint && isRelative) {
                    lx = lastPoint.x;
                    ly = lastPoint.y;
                } else {
                    lx = 0;
                    ly = 0;
                }

                var point = {
                    x: lx + px,
                    y: ly + py
                };

                // establecer el último punto
                if (isRelative || !lastPoint) {
                    lastPoint = point;
                }

                points.push(point);

                x = lx + px;
                y = ly + py;
            }
        };

        var addSegmentPoint = function(segment) {
            var segType = segment.pathSegTypeAsLetter.toUpperCase();

            // saltarse el camino termina
            if (segType === 'Z') 
                return;

            // mapear segmento a x y y
            switch (segType) {

            case 'M':
            case 'L':
            case 'T':
            case 'C':
            case 'S':
            case 'Q':
                x = segment.x;
                y = segment.y;
                break;
            case 'H':
                x = segment.x;
                break;
            case 'V':
                y = segment.y;
                break;
            }

            addPoint(x, y, segment.pathSegType);
        };

        // asegúrese de que el camino sea absoluto
        _svgPathToAbsolute(path);

        // obtener la longitud total
        total = path.getTotalLength();

        // segmentos de cola
        segments = [];
        for (i = 0; i < path.pathSegList.numberOfItems; i += 1)
            segments.push(path.pathSegList.getItem(i));

        segmentsQueue = segments.concat();

        // muestra a través del camino
        while (length < total) {
            // get segment at position
            segmentIndex = path.getPathSegAtLength(length);
            segment = segments[segmentIndex];

            // nuevo segmento
            if (segment != lastSegment) {
                while (segmentsQueue.length && segmentsQueue[0] != segment)
                    addSegmentPoint(segmentsQueue.shift());

                lastSegment = segment;
            }

            // agregue puntos en el medio al curvar
            // TODO: muestreo adaptativo
            switch (segment.pathSegTypeAsLetter.toUpperCase()) {

            case 'C':
            case 'T':
            case 'S':
            case 'Q':
            case 'A':
                point = path.getPointAtLength(length);
                addPoint(point.x, point.y, 0);
                break;

            }

            // incremento por valor de muestra
            length += sampleLength;
        }

        // agregar segmentos restantes no aprobados por muestreo
        for (i = 0, il = segmentsQueue.length; i < il; ++i)
            addSegmentPoint(segmentsQueue[i]);

        return points;
    };

    var _svgPathToAbsolute = function(path) {
        // http://phrogz.net/convert-svg-path-to-all-absolute-commands
        var x0, y0, x1, y1, x2, y2, segs = path.pathSegList,
            x = 0, y = 0, len = segs.numberOfItems;

        for (var i = 0; i < len; ++i) {
            var seg = segs.getItem(i),
                segType = seg.pathSegTypeAsLetter;

            if (/[MLHVCSQTA]/.test(segType)) {
                if ('x' in seg) x = seg.x;
                if ('y' in seg) y = seg.y;
            } else {
                if ('x1' in seg) x1 = x + seg.x1;
                if ('x2' in seg) x2 = x + seg.x2;
                if ('y1' in seg) y1 = y + seg.y1;
                if ('y2' in seg) y2 = y + seg.y2;
                if ('x' in seg) x += seg.x;
                if ('y' in seg) y += seg.y;

                switch (segType) {

                case 'm':
                    segs.replaceItem(path.createSVGPathSegMovetoAbs(x, y), i);
                    break;
                case 'l':
                    segs.replaceItem(path.createSVGPathSegLinetoAbs(x, y), i);
                    break;
                case 'h':
                    segs.replaceItem(path.createSVGPathSegLinetoHorizontalAbs(x), i);
                    break;
                case 'v':
                    segs.replaceItem(path.createSVGPathSegLinetoVerticalAbs(y), i);
                    break;
                case 'c':
                    segs.replaceItem(path.createSVGPathSegCurvetoCubicAbs(x, y, x1, y1, x2, y2), i);
                    break;
                case 's':
                    segs.replaceItem(path.createSVGPathSegCurvetoCubicSmoothAbs(x, y, x2, y2), i);
                    break;
                case 'q':
                    segs.replaceItem(path.createSVGPathSegCurvetoQuadraticAbs(x, y, x1, y1), i);
                    break;
                case 't':
                    segs.replaceItem(path.createSVGPathSegCurvetoQuadraticSmoothAbs(x, y), i);
                    break;
                case 'a':
                    segs.replaceItem(path.createSVGPathSegArcAbs(x, y, seg.r1, seg.r2, seg.angle, seg.largeArcFlag, seg.sweepFlag), i);
                    break;
                case 'z':
                case 'Z':
                    x = x0;
                    y = y0;
                    break;

                }
            }

            if (segType == 'M' || segType == 'm') {
                x0 = x;
                y0 = y;
            }
        }
    };

})();
},{"../geometry/Bounds":26}],28:[function(_dereq_,module,exports){
/**
* El módulo `Matter.Vector` contiene métodos para crear y manipular vectores.
* Los vectores son la base de todas las operaciones relacionadas con la geometría en el motor.
* Un objeto `Matter.Vector` tiene la forma `{ x: 0, y: 0 }`.
*
* Ver el uso incluido [ejemplos](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Vector - Vector
*/

// TODO: considere parametros para reutilizar objetos vectoriales

var Vector = {};

module.exports = Vector;

(function() {

    /**
     * Crea un nuevo vector.
     * @method create - crear
     * @param {number} x
     * @param {number} y
     * @return {vector} Un nuevo vector
     */
    Vector.create = function(x, y) {
        return { x: x || 0, y: y || 0 };
    };

    /**
     * Devuelve un nuevo vector con `x` y `y` copiados del `vector` dado.
     * @method clone - clon
     * @param {vector} vector - vector
     * @return {vector} Un nuevo vector clonado
     */
    Vector.clone = function(vector) {
        return { x: vector.x, y: vector.y };
    };

    /**
     * Devuelve la magnitud (longitud) de un vector.
     * @method magnitude - magnitud
     * @param {vector} vector - vector
     * @return {number} La magnitud del vector
     */
    Vector.magnitude = function(vector) {
        return Math.sqrt((vector.x * vector.x) + (vector.y * vector.y));
    };

    /**
     * Devuelve la magnitud (longitud) de un vector (por lo tanto, se guarda una operación `sqrt`).
     * @method magnitudeSquared - magnitud al cuadrado
     * @param {vector} vector - vector
     * @return {number} La magnitud al cuadrado del vector
     */
    Vector.magnitudeSquared = function(vector) {
        return (vector.x * vector.x) + (vector.y * vector.y);
    };

    /**
     * Gira el vector alrededor de (0, 0) en un ángulo especificado.
     * @method rotate - rotar
     * @param {vector} vector  - vector
     * @param {number} angle - ángulo
     * @return {vector} Un nuevo vector rotó alrededor de (0, 0)
     */
    Vector.rotate = function(vector, angle) {
        var cos = Math.cos(angle), sin = Math.sin(angle);
        return {
            x: vector.x * cos - vector.y * sin,
            y: vector.x * sin + vector.y * cos
        };
    };

    /**
     * Gira el vector alrededor de un punto especificado en un ángulo especificado.
     * @method rotateAbout - rotar
     * @param {vector} vector - vector 
     * @param {number} angle - ángulo 
     * @param {vector} point - punto
     * @param {vector} [output]
     * @return {vector} Un nuevo vector girado sobre el punto
     */
    Vector.rotateAbout = function(vector, angle, point, output) {
        var cos = Math.cos(angle), sin = Math.sin(angle);
        if (!output) output = {};
        var x = point.x + ((vector.x - point.x) * cos - (vector.y - point.y) * sin);
        output.y = point.y + ((vector.x - point.x) * sin + (vector.y - point.y) * cos);
        output.x = x;
        return output;
    };

    /**
     * Normaliza un vector (tal que su magnitud sea "1").
     * @method normalise - normaliza
     * @param {vector} vector - vector
     * @return {vector} Un nuevo vector normalizado
     */
    Vector.normalise = function(vector) {
        var magnitude = Vector.magnitude(vector);
        if (magnitude === 0)
            return { x: 0, y: 0 };
        return { x: vector.x / magnitude, y: vector.y / magnitude };
    };

    /**
     * Devuelve el producto escalar de dos vectores.
     * @method dot - punto
     * @param {vector} vectorA 
     * @param {vector} vectorB 
     * @return {number} El producto escalar de los dos vectores
     */
    Vector.dot = function(vectorA, vectorB) {
        return (vectorA.x * vectorB.x) + (vectorA.y * vectorB.y);
    };

    /**
     * Devuelve el producto cruzado de dos vectores.
     * @method cross - cruzar
     * @param {vector} vectorA 
     * @param {vector} vectorB 
     * @return {number} El producto cruzado de los dos vectores
     */
    Vector.cross = function(vectorA, vectorB) {
        return (vectorA.x * vectorB.y) - (vectorA.y * vectorB.x);
    };

    /**
     * Devuelve el producto cruzado de tres vectores.
     * @method cross3 - cruzar3
     * @param {vector} vectorA 
     * @param {vector} vectorB 
     * @param {vector} vectorC
     * @return {number} El producto cruzado de los tres vectores
     */
    Vector.cross3 = function(vectorA, vectorB, vectorC) {
        return (vectorB.x - vectorA.x) * (vectorC.y - vectorA.y) - (vectorB.y - vectorA.y) * (vectorC.x - vectorA.x);
    };

    /**
     * Agrega los dos vectores.
     * @method add - agregar
     * @param {vector} vectorA
     * @param {vector} vectorB 
     * @param {vector} [output]
     * @return {vector} Se agregó un nuevo vector de vectorA y vectorB
     */
    Vector.add = function(vectorA, vectorB, output) {
        if (!output) output = {};
        output.x = vectorA.x + vectorB.x;
        output.y = vectorA.y + vectorB.y;
        return output;
    };

    /**
     * Resta los dos vectores.
     * @method sub - resta
     * @param {vector} vectorA 
     * @param {vector} vectorB 
     * @param {vector} [output]
     * @return {vector} Se resta un nuevo vector de vectorA y vectorB
     */
    Vector.sub = function(vectorA, vectorB, output) {
        if (!output) output = {};
        output.x = vectorA.x - vectorB.x;
        output.y = vectorA.y - vectorB.y;
        return output;
    };

    /**
     * Multiplica un vector y un escalar.
     * @method mult - multiplicar
     * @param {vector} vector - vector
     * @param {number} scalar - escalar
     * @return {vector} Multiplica un vector y un escalar.
     */
    Vector.mult = function(vector, scalar) {
        return { x: vector.x * scalar, y: vector.y * scalar };
    };

    /**
     * Divide un vector y un escalar.
     * @method div - dividir
     * @param {vector} vector - vector
     * @param {number} scalar - escalar 
     * @return {vector} Un nuevo vector dividido por escalar
     */
    Vector.div = function(vector, scalar) {
        return { x: vector.x / scalar, y: vector.y / scalar };
    };

    /**
     * Devuelve el vector perpendicular. Establezca `negate` en verdadero para la perpendicular en la dirección opuesta.
     * @method perp - perpendicular
     * @param {vector} vector - vector 
     * @param {bool} [negate=false]
     * @return {vector} El vector perpendicular
     */
    Vector.perp = function(vector, negate) {
        negate = negate === true ? -1 : 1;
        return { x: negate * -vector.y, y: negate * vector.x };
    };

    /**
     * Niega ambos componentes de un vector de modo que apunte en la dirección opuesta.
     * @method neg - negar
     * @param {vector} vector - vector
     * @return {vector} El vector negado
     */
    Vector.neg = function(vector) {
        return { x: -vector.x, y: -vector.y };
    };

    /**
     * Devuelve el ángulo en radianes entre los dos vectores en relación con el eje x.
     * @method angle - ángulo
     * @param {vector} vectorA 
     * @param {vector} vectorB
     * @return {number} El ángulo en radianes
     */
    Vector.angle = function(vectorA, vectorB) {
        return Math.atan2(vectorB.y - vectorA.y, vectorB.x - vectorA.x);
    };

    /**
     * Grupo de vectores temporal (no seguro para subprocesos).
     * @property _temp
     * @type {vector[]}
     * @private
     */
    Vector._temp = [
        Vector.create(), Vector.create(), 
        Vector.create(), Vector.create(), 
        Vector.create(), Vector.create()
    ];

})();
},{}],29:[function(_dereq_,module,exports){
/**
* El módulo `Matter.Vertices` contiene métodos para crear y manipular conjuntos de vértices.
* Un conjunto de vértices es una matriz de `Matter.Vector` con propiedades de indexación adicionales insertadas por `Vertices.create`.
* Un `Matter.Body` mantiene un conjunto de vértices para representar la forma del objeto (su envolvente convexo).
*
* Ver el uso incluido [ejemplos](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Vertices - Vertices
*/

var Vertices = {};

module.exports = Vertices;

var Vector = _dereq_('../geometry/Vector');
var Common = _dereq_('../core/Common');

(function() {

    /**
     * Crea un nuevo conjunto de vértices compatibles con `Matter.Body`.
     * El argumento `points` acepta una matriz de puntos `Matter.Vector` orientados alrededor del origen `(0, 0)`, por ejemplo:
     *
     *     [{ x: 0, y: 0 }, { x: 25, y: 50 }, { x: 50, y: 0 }]
     *
     * El método `Vertices.create` devuelve una nueva matriz de vértices, que son similares a los objetos Matter.Vector,
     * pero con algunas referencias adicionales necesarias para rutinas de detección de colisiones eficientes.
     *
     * Los vértices deben especificarse en el orden de las agujas del reloj.
     *
     * Ten en cuenta que el argumento `body` no es opcional, se debe proporcionar una referencia de` Matter.Body`.
     *
     * @method create - crear
     * @param {vector[]} points - puntos 
     * @param {body} body - cuerpo
     */
    Vertices.create = function(points, body) {
        var vertices = [];

        for (var i = 0; i < points.length; i++) {
            var point = points[i],
                vertex = {
                    x: point.x,
                    y: point.y,
                    index: i,
                    body: body,
                    isInternal: false
                };

            vertices.push(vertex);
        }

        return vertices;
    };

    /**
     * Analiza una cadena que contiene pares x y ordenados separados por espacios (y opcionalmente comas),
     * en un objeto `Matter.Vertices` para el` Matter.Body` dado.
     * Para analizar las rutas SVG, consulte `Svg.pathToVertices`.
     * @method fromPath - delaRuta
     * @param {string} path - ruta
     * @param {body} body - cuerpo
     * @return {vertices} vertices - vértices
     */
    Vertices.fromPath = function(path, body) {
        var pathPattern = /L?\s*([\-\d\.e]+)[\s,]*([\-\d\.e]+)*/ig,
            points = [];

        path.replace(pathPattern, function(match, x, y) {
            points.push({ x: parseFloat(x), y: parseFloat(y) });
        });

        return Vertices.create(points, body);
    };

    /**
     * Devuelve el centro (centroide) del conjunto de vértices.
     * @method centre - centro 
     * @param {vertices} vertices - vértices
     * @return {vector} El punto central
     */
    Vertices.centre = function(vertices) {
        var area = Vertices.area(vertices, true),
            centre = { x: 0, y: 0 },
            cross,
            temp,
            j;

        for (var i = 0; i < vertices.length; i++) {
            j = (i + 1) % vertices.length;
            cross = Vector.cross(vertices[i], vertices[j]);
            temp = Vector.mult(Vector.add(vertices[i], vertices[j]), cross);
            centre = Vector.add(centre, temp);
        }

        return Vector.div(centre, 6 * area);
    };

    /**
     * Devuelve el promedio (media) del conjunto de vértices.
     * @method mean - media
     * @param {vertices} vertices - vértices
     * @return {vector} El punto promedio
     */
    Vertices.mean = function(vertices) {
        var average = { x: 0, y: 0 };

        for (var i = 0; i < vertices.length; i++) {
            average.x += vertices[i].x;
            average.y += vertices[i].y;
        }

        return Vector.div(average, vertices.length);
    };

    /**
     * Devuelve el área del conjunto de vértices.
     * @method area - área
     * @param {vertices} vertices - vértices
     * @param {bool} signed - inscrito
     * @return {number} The area - El área
     */
    Vertices.area = function(vertices, signed) {
        var area = 0,
            j = vertices.length - 1;

        for (var i = 0; i < vertices.length; i++) {
            area += (vertices[j].x - vertices[i].x) * (vertices[j].y + vertices[i].y);
            j = i;
        }

        if (signed)
            return area / 2;

        return Math.abs(area) / 2;
    };

    /**
     * Devuelve el momento de inercia (segundo momento de área) del conjunto de vértices dada la masa total.
     * @method inertia - inercia
     * @param {vertices} vertices - vértices
     * @param {number} mass - masa
     * @return {number} El momento de inercia del polígono
     */
    Vertices.inertia = function(vertices, mass) {
        var numerator = 0,
            denominator = 0,
            v = vertices,
            cross,
            j;

        // encontrar el momento de inercia del polígono, usando el segundo momento del área
        // http://www.physicsforums.com/showthread.php?t=25293
        for (var n = 0; n < v.length; n++) {
            j = (n + 1) % v.length;
            cross = Math.abs(Vector.cross(v[j], v[n]));
            numerator += cross * (Vector.dot(v[j], v[j]) + Vector.dot(v[j], v[n]) + Vector.dot(v[n], v[n]));
            denominator += cross;
        }

        return (mass / 6) * (numerator / denominator);
    };

    /**
     * Traslada el conjunto de vértices en el lugar.
     * @method translate - traslada
     * @param {vertices} vertices - vértices
     * @param {vector} vector - vector
     * @param {number} scalar - escalar
     */
    Vertices.translate = function(vertices, vector, scalar) {
        var i;
        if (scalar) {
            for (i = 0; i < vertices.length; i++) {
                vertices[i].x += vector.x * scalar;
                vertices[i].y += vector.y * scalar;
            }
        } else {
            for (i = 0; i < vertices.length; i++) {
                vertices[i].x += vector.x;
                vertices[i].y += vector.y;
            }
        }

        return vertices;
    };

    /**
     * Gira el conjunto de vértices en el lugar
     * @method rotate - rotar
     * @param {vertices} vertices - vértices
     * @param {number} angle - ángulo
     * @param {vector} point - punto
     */
    Vertices.rotate = function(vertices, angle, point) {
        if (angle === 0)
            return;

        var cos = Math.cos(angle),
            sin = Math.sin(angle);

        for (var i = 0; i < vertices.length; i++) {
            var vertice = vertices[i],
                dx = vertice.x - point.x,
                dy = vertice.y - point.y;
                
            vertice.x = point.x + (dx * cos - dy * sin);
            vertice.y = point.y + (dx * sin + dy * cos);
        }

        return vertices;
    };

    /**
     * Devuelve 'verdadero' si el "punto" está dentro del conjunto de 'vértices'.
     * @method contains - contener
     * @param {vertices} vertices - vértices
     * @param {vector} point - punto
     * @return {boolean} Verdadero si los vértices contienen un punto, de lo contrario es falso
     */
    Vertices.contains = function(vertices, point) {
        for (var i = 0; i < vertices.length; i++) {
            var vertice = vertices[i],
                nextVertice = vertices[(i + 1) % vertices.length];
            if ((point.x - vertice.x) * (nextVertice.y - vertice.y) + (point.y - vertice.y) * (vertice.x - nextVertice.x) > 0) {
                return false;
            }
        }

        return true;
    };

    /**
     * Escala los vértices desde un punto (el predeterminado es el centro) en el lugar.
     * @method scale - Escala
     * @param {vertices} vertices - vértices
     * @param {number} scaleX 
     * @param {number} scaleY 
     * @param {vector} point - punto
     */
    Vertices.scale = function(vertices, scaleX, scaleY, point) {
        if (scaleX === 1 && scaleY === 1)
            return vertices;

        point = point || Vertices.centre(vertices);

        var vertex,
            delta;

        for (var i = 0; i < vertices.length; i++) {
            vertex = vertices[i];
            delta = Vector.sub(vertex, point);
            vertices[i].x = point.x + delta.x * scaleX;
            vertices[i].y = point.y + delta.y * scaleY;
        }

        return vertices;
    };

    /**
     * Chaflana un conjunto de vértices dándoles esquinas redondeadas, devuelve un nuevo conjunto de vértices.
     * El parámetro de radio es un solo número o una matriz para especificar el radio de cada vértice.
     * @method chamfer - chaflan
     * @param {vertices} vertices - vértices
     * @param {number[]} radius - radios
     * @param {number} quality - calidad
     * @param {number} qualityMin 
     * @param {number} qualityMax 
     */
    Vertices.chamfer = function(vertices, radius, quality, qualityMin, qualityMax) {
        radius = radius || [8];

        if (!radius.length)
            radius = [radius];

        // la calidad tiene un valor predeterminado de -1, que es automático
        quality = (typeof quality !== 'undefined') ? quality : -1;
        qualityMin = qualityMin || 2;
        qualityMax = qualityMax || 14;

        var newVertices = [];

        for (var i = 0; i < vertices.length; i++) {
            var prevVertex = vertices[i - 1 >= 0 ? i - 1 : vertices.length - 1],
                vertex = vertices[i],
                nextVertex = vertices[(i + 1) % vertices.length],
                currentRadius = radius[i < radius.length ? i : radius.length - 1];

            if (currentRadius === 0) {
                newVertices.push(vertex);
                continue;
            }

            var prevNormal = Vector.normalise({ 
                x: vertex.y - prevVertex.y, 
                y: prevVertex.x - vertex.x
            });

            var nextNormal = Vector.normalise({ 
                x: nextVertex.y - vertex.y, 
                y: vertex.x - nextVertex.x
            });

            var diagonalRadius = Math.sqrt(2 * Math.pow(currentRadius, 2)),
                radiusVector = Vector.mult(Common.clone(prevNormal), currentRadius),
                midNormal = Vector.normalise(Vector.mult(Vector.add(prevNormal, nextNormal), 0.5)),
                scaledVertex = Vector.sub(vertex, Vector.mult(midNormal, diagonalRadius));

            var precision = quality;

            if (quality === -1) {
                // decidir automáticamente la precisión
                precision = Math.pow(currentRadius, 0.32) * 1.75;
            }

            precision = Common.clamp(precision, qualityMin, qualityMax);

            // use un valor par para la precisión, es más probable que reduzca los ejes mediante el uso de simetría
            if (precision % 2 === 1)
                precision += 1;

            var alpha = Math.acos(Vector.dot(prevNormal, nextNormal)),
                theta = alpha / precision;

            for (var j = 0; j < precision; j++) {
                newVertices.push(Vector.add(Vector.rotate(radiusVector, theta * j), scaledVertex));
            }
        }

        return newVertices;
    };

    /**
     * Ordena los vértices de entrada en el sentido de las manecillas del reloj en su lugar.
     * @method clockwiseSort 
     * @param {vertices} vertices - vértices
     * @return {vertices} vertices - vértices
     */
    Vertices.clockwiseSort = function(vertices) {
        var centre = Vertices.mean(vertices);

        vertices.sort(function(vertexA, vertexB) {
            return Vector.angle(centre, vertexA) - Vector.angle(centre, vertexB);
        });

        return vertices;
    };

    /**
     * Devuelve verdadero si los vértices forman una forma convexa (los vértices deben estar en el orden de las manecillas del reloj).
     * @method isConvex 
     * @param {vertices} vertices - vértices
     * @return {bool}  `true` si los` vértices` son convexos, `false` si no (o` null` si no es computable).
     */
    Vertices.isConvex = function(vertices) {
        // http://paulbourke.net/geometry/polygonmesh/

        var flag = 0,
            n = vertices.length,
            i,
            j,
            k,
            z;

        if (n < 3)
            return null;

        for (i = 0; i < n; i++) {
            j = (i + 1) % n;
            k = (i + 2) % n;
            z = (vertices[j].x - vertices[i].x) * (vertices[k].y - vertices[j].y);
            z -= (vertices[j].y - vertices[i].y) * (vertices[k].x - vertices[j].x);

            if (z < 0) {
                flag |= 1;
            } else if (z > 0) {
                flag |= 2;
            }

            if (flag === 3) {
                return false;
            }
        }

        if (flag !== 0){
            return true;
        } else {
            return null;
        }
    };

    /**
     * Devuelve el envolvente convexo de los vértices de entrada como una nueva matriz de puntos.
     * @method hull - envolvente
     * @param {vertices} vertices - vértices
     * @return [vertex] vertices - vértices
     */
    Vertices.hull = function(vertices) {
        // http://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Convex_hull/Monotone_chain

        var upper = [],
            lower = [], 
            vertex,
            i;

        // ordenar vértices en el eje x (eje y para empates)
        vertices = vertices.slice(0);
        vertices.sort(function(vertexA, vertexB) {
            var dx = vertexA.x - vertexB.x;
            return dx !== 0 ? dx : vertexA.y - vertexB.y;
        });

        // construir un envolvente inferior
        for (i = 0; i < vertices.length; i++) {
            vertex = vertices[i];

            while (lower.length >= 2 
                   && Vector.cross3(lower[lower.length - 2], lower[lower.length - 1], vertex) <= 0) {
                lower.pop();
            }

            lower.push(vertex);
        }

        // construir un envolvente superior
        for (i = vertices.length - 1; i >= 0; i--) {
            vertex = vertices[i];

            while (upper.length >= 2 
                   && Vector.cross3(upper[upper.length - 2], upper[upper.length - 1], vertex) <= 0) {
                upper.pop();
            }

            upper.push(vertex);
        }

        // la concatenación de los envolvente inferior y superior da el casco convexo
        // omitir los últimos puntos porque se repiten al principio de la otra lista
        upper.pop();
        lower.pop();

        return upper.concat(lower);
    };

})();

},{"../core/Common":14,"../geometry/Vector":28}],30:[function(_dereq_,module,exports){
var Matter = module.exports = _dereq_('../core/Matter');

Matter.Body = _dereq_('../body/Body');
Matter.Composite = _dereq_('../body/Composite');
Matter.World = _dereq_('../body/World');

Matter.Contact = _dereq_('../collision/Contact');
Matter.Detector = _dereq_('../collision/Detector');
Matter.Grid = _dereq_('../collision/Grid');
Matter.Pairs = _dereq_('../collision/Pairs');
Matter.Pair = _dereq_('../collision/Pair');
Matter.Query = _dereq_('../collision/Query');
Matter.Resolver = _dereq_('../collision/Resolver');
Matter.SAT = _dereq_('../collision/SAT');

Matter.Constraint = _dereq_('../constraint/Constraint');
Matter.MouseConstraint = _dereq_('../constraint/MouseConstraint');

Matter.Common = _dereq_('../core/Common');
Matter.Engine = _dereq_('../core/Engine');
Matter.Events = _dereq_('../core/Events');
Matter.Mouse = _dereq_('../core/Mouse');
Matter.Runner = _dereq_('../core/Runner');
Matter.Sleeping = _dereq_('../core/Sleeping');
Matter.Plugin = _dereq_('../core/Plugin');


Matter.Bodies = _dereq_('../factory/Bodies');
Matter.Composites = _dereq_('../factory/Composites');

Matter.Axes = _dereq_('../geometry/Axes');
Matter.Bounds = _dereq_('../geometry/Bounds');
Matter.Svg = _dereq_('../geometry/Svg');
Matter.Vector = _dereq_('../geometry/Vector');
Matter.Vertices = _dereq_('../geometry/Vertices');

Matter.Render = _dereq_('../render/Render');
Matter.RenderPixi = _dereq_('../render/RenderPixi');

// alias

Matter.World.add = Matter.Composite.add;
Matter.World.remove = Matter.Composite.remove;
Matter.World.addComposite = Matter.Composite.addComposite;
Matter.World.addBody = Matter.Composite.addBody;
Matter.World.addConstraint = Matter.Composite.addConstraint;
Matter.World.clear = Matter.Composite.clear;
Matter.Engine.run = Matter.Runner.run;

},{"../body/Body":1,"../body/Composite":2,"../body/World":3,"../collision/Contact":4,"../collision/Detector":5,"../collision/Grid":6,"../collision/Pair":7,"../collision/Pairs":8,"../collision/Query":9,"../collision/Resolver":10,"../collision/SAT":11,"../constraint/Constraint":12,"../constraint/MouseConstraint":13,"../core/Common":14,"../core/Engine":15,"../core/Events":16,"../core/Matter":17,"../core/Metrics":18,"../core/Mouse":19,"../core/Plugin":20,"../core/Runner":21,"../core/Sleeping":22,"../factory/Bodies":23,"../factory/Composites":24,"../geometry/Axes":25,"../geometry/Bounds":26,"../geometry/Svg":27,"../geometry/Vector":28,"../geometry/Vertices":29,"../render/Render":31,"../render/RenderPixi":32}],31:[function(_dereq_,module,exports){
/**
* El módulo `Matter.Render` es un sencillo renderizador basado en lienzo HTML5 para visualizar instancias de `Matter.Engine`.
* Está diseñado para fines de desarrollo y depuración, pero también puede ser adecuado para juegos simples.
* Incluye una serie de opciones de dibujo que incluyen wireframe, vector con soporte para sprites y viewports.
*
* @class Render - renderizar
*/

var Render = {};

module.exports = Render;

var Common = _dereq_('../core/Common');
var Composite = _dereq_('../body/Composite');
var Bounds = _dereq_('../geometry/Bounds');
var Events = _dereq_('../core/Events');
var Grid = _dereq_('../collision/Grid');
var Vector = _dereq_('../geometry/Vector');
var Mouse = _dereq_('../core/Mouse');

(function() {
    
    var _requestAnimationFrame,
        _cancelAnimationFrame;

    if (typeof window !== 'undefined') {
        _requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame
                                      || window.mozRequestAnimationFrame || window.msRequestAnimationFrame 
                                      || function(callback){ window.setTimeout(function() { callback(Common.now()); }, 1000 / 60); };
   
        _cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame 
                                      || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;
    }

    /**
     * Crea un nuevo renderizador. El parámetro de opciones es un objeto que especifica las propiedades que desea anular los valores predeterminados.
     * Todas las propiedades tienen valores predeterminados y muchas se precalculan automáticamente en función de otras propiedades.
     * Consulte la sección de propiedades a continuación para obtener información detallada sobre lo que puede pasar a través del objeto `options`.
     * @method create - crear
     * @param {object} [options]
     * @return {render} Un nuevo reproducto
     */
    Render.create = function(options) {
        var defaults = {
            controller: Render,
            engine: null,
            element: null,
            canvas: null,
            mouse: null,
            frameRequestId: null,
            options: {
                width: 800,
                height: 600,
                pixelRatio: 1,
                background: '#18181d',
                wireframeBackground: '#0f0f13',
                hasBounds: !!options.bounds,
                enabled: true,
                wireframes: true,
                showSleeping: true,
                showDebug: false,
                showBroadphase: false,
                showBounds: false,
                showVelocity: false,
                showCollisions: false,
                showSeparations: false,
                showAxes: false,
                showPositions: false,
                showAngleIndicator: false,
                showIds: false,
                showShadows: false,
                showVertexNumbers: false,
                showConvexHulls: false,
                showInternalEdges: false,
                showMousePosition: false
            }
        };

        var render = Common.extend(defaults, options);

        if (render.canvas) {
            render.canvas.width = render.options.width || render.canvas.width;
            render.canvas.height = render.options.height || render.canvas.height;
        }

        render.mouse = options.mouse;
        render.engine = options.engine;
        render.canvas = render.canvas || _createCanvas(render.options.width, render.options.height);
        render.context = render.canvas.getContext('2d');
        render.textures = {};

        render.bounds = render.bounds || { 
            min: { 
                x: 0,
                y: 0
            }, 
            max: { 
                x: render.canvas.width,
                y: render.canvas.height
            }
        };

        if (render.options.pixelRatio !== 1) {
            Render.setPixelRatio(render, render.options.pixelRatio);
        }

        if (Common.isElement(render.element)) {
            render.element.appendChild(render.canvas);
        } else {
            Common.log('Render.create: options.element was undefined, render.canvas was created but not appended', 'warn');
        }

        return render;
    };

    /**
     * Actualiza continuamente el lienzo de renderizado en el evento `requestAnimationFrame`.
     * @method run - reproducir
     * @param {render} render - renderizar
     */
    Render.run = function(render) {
        (function loop(time){
            render.frameRequestId = _requestAnimationFrame(loop);
            Render.world(render);
        })();
    };

    /**
     * Finaliza la ejecución de `Render.run` en el `render` dado, cancelando el bucle de evento de solicitud de cuadro de animación.
     * @method stop - detener
     * @param {render} render - renderizar
     */
    Render.stop = function(render) {
        _cancelAnimationFrame(render.frameRequestId);
    };

    /**
     * Establece la proporción de píxeles del renderizador y actualiza el lienzo.
     * Para detectar automáticamente la proporción correcta, pase la cadena `'auto'` para `pixelRatio`.
     * @method setPixelRatio
     * @param {render} render - renderizar
     * @param {number} pixelRatio
     */
    Render.setPixelRatio = function(render, pixelRatio) {
        var options = render.options,
            canvas = render.canvas;

        if (pixelRatio === 'auto') {
            pixelRatio = _getPixelRatio(canvas);
        }

        options.pixelRatio = pixelRatio;
        canvas.setAttribute('data-pixel-ratio', pixelRatio);
        canvas.width = options.width * pixelRatio;
        canvas.height = options.height * pixelRatio;
        canvas.style.width = options.width + 'px';
        canvas.style.height = options.height + 'px';
        render.context.scale(pixelRatio, pixelRatio);
    };

    /**
     * Coloca y ajusta el tamaño de la ventana gráfica alrededor de los límites del objeto dado.
     * Los objetos deben tener al menos una de las siguientes propiedades:
     * - `object.bounds`
     * - `object.position`
     * - `object.min` y `object.max`
     * - `object.x` y `object.y`
     * @method lookAt 
     * @param {render} render - renderizar
     * @param {object[]} objects - objetos
     * @param {vector} [padding]
     * @param {bool} [center=true]
     */
    Render.lookAt = function(render, objects, padding, center) {
        center = typeof center !== 'undefined' ? center : true;
        objects = Common.isArray(objects) ? objects : [objects];
        padding = padding || {
            x: 0,
            y: 0
        };

        // encontrar los límites de todos los objetos
        var bounds = {
            min: { x: Infinity, y: Infinity },
            max: { x: -Infinity, y: -Infinity }
        };

        for (var i = 0; i < objects.length; i += 1) {
            var object = objects[i],
                min = object.bounds ? object.bounds.min : (object.min || object.position || object),
                max = object.bounds ? object.bounds.max : (object.max || object.position || object); 

            if (min && max) { 
                if (min.x < bounds.min.x) 
                    bounds.min.x = min.x;
                    
                if (max.x > bounds.max.x) 
                    bounds.max.x = max.x;

                if (min.y < bounds.min.y) 
                    bounds.min.y = min.y;

                if (max.y > bounds.max.y) 
                    bounds.max.y = max.y;
            }
        }

        // encontrar proporcion
        var width = (bounds.max.x - bounds.min.x) + 2 * padding.x,
            height = (bounds.max.y - bounds.min.y) + 2 * padding.y,
            viewHeight = render.canvas.height,
            viewWidth = render.canvas.width,
            outerRatio = viewWidth / viewHeight,
            innerRatio = width / height,
            scaleX = 1,
            scaleY = 1;

        // encontrar factor de escala
        if (innerRatio > outerRatio) {
            scaleY = innerRatio / outerRatio;
        } else {
            scaleX = outerRatio / innerRatio;
        }

        // habilitar límites
        render.options.hasBounds = true;

        // posición y tamaño
        render.bounds.min.x = bounds.min.x;
        render.bounds.max.x = bounds.min.x + width * scaleX;
        render.bounds.min.y = bounds.min.y;
        render.bounds.max.y = bounds.min.y + height * scaleY;

        // centro
        if (center) {
            render.bounds.min.x += width * 0.5 - (width * scaleX) * 0.5;
            render.bounds.max.x += width * 0.5 - (width * scaleX) * 0.5;
            render.bounds.min.y += height * 0.5 - (height * scaleY) * 0.5;
            render.bounds.max.y += height * 0.5 - (height * scaleY) * 0.5;
        }

        // relleno
        render.bounds.min.x -= padding.x;
        render.bounds.max.x -= padding.x;
        render.bounds.min.y -= padding.y;
        render.bounds.max.y -= padding.y;

        // actualizar el ratón
        if (render.mouse) {
            Mouse.setScale(render.mouse, {
                x: (render.bounds.max.x - render.bounds.min.x) / render.canvas.width,
                y: (render.bounds.max.y - render.bounds.min.y) / render.canvas.height
            });

            Mouse.setOffset(render.mouse, render.bounds.min);
        }
    };

    /**
     * Aplica transformaciones de viewport basadas en `render.bounds` a un contexto de render.
     * @method startViewTransform 
     * @param {render} render - renderizar
     */
    Render.startViewTransform = function(render) {
        var boundsWidth = render.bounds.max.x - render.bounds.min.x,
            boundsHeight = render.bounds.max.y - render.bounds.min.y,
            boundsScaleX = boundsWidth / render.options.width,
            boundsScaleY = boundsHeight / render.options.height;

        render.context.scale(1 / boundsScaleX, 1 / boundsScaleY);
        render.context.translate(-render.bounds.min.x, -render.bounds.min.y);
    };

    /**
     * Restablece todas las transformaciones en el contexto de renderizado.
     * @method endViewTransform 
     * @param {render} render - renderizar
     */
    Render.endViewTransform = function(render) {
        render.context.setTransform(render.options.pixelRatio, 0, 0, render.options.pixelRatio, 0, 0);
    };

    /**
     * Muestra el objeto `Matter.World` del` engine` dado.
     * Este es el punto de entrada para todos los renderizados y se debe llamar cada vez que cambia la escena.
     * @method world - mundo
     * @param {render} render - renderizar
     */
    Render.world = function(render) {
        var engine = render.engine,
            world = engine.world,
            canvas = render.canvas,
            context = render.context,
            options = render.options,
            allBodies = Composite.allBodies(world),
            allConstraints = Composite.allConstraints(world),
            background = options.wireframes ? options.wireframeBackground : options.background,
            bodies = [],
            constraints = [],
            i;

        var event = {
            timestamp: engine.timing.timestamp
        };

        Events.trigger(render, 'beforeRender', event);

        // aplicar fondo si ha cambiado
        if (render.currentBackground !== background)
            _applyBackground(render, background);

        // limpia el lienzo con un relleno transparente, para permitir que se muestre el fondo del lienzo
        context.globalCompositeOperation = 'source-in';
        context.fillStyle = "transparent";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.globalCompositeOperation = 'source-over';

        // manejar límites
        if (options.hasBounds) {
            // filtrar los cuerpos que no están a la vista
            for (i = 0; i < allBodies.length; i++) {
                var body = allBodies[i];
                if (Bounds.overlaps(body.bounds, render.bounds))
                    bodies.push(body);
            }

            // filtrar las restricciones que no están a la vista
            for (i = 0; i < allConstraints.length; i++) {
                var constraint = allConstraints[i],
                    bodyA = constraint.bodyA,
                    bodyB = constraint.bodyB,
                    pointAWorld = constraint.pointA,
                    pointBWorld = constraint.pointB;

                if (bodyA) pointAWorld = Vector.add(bodyA.position, constraint.pointA);
                if (bodyB) pointBWorld = Vector.add(bodyB.position, constraint.pointB);

                if (!pointAWorld || !pointBWorld)
                    continue;

                if (Bounds.contains(render.bounds, pointAWorld) || Bounds.contains(render.bounds, pointBWorld))
                    constraints.push(constraint);
            }

            // transformar la vista
            Render.startViewTransform(render);

            // actualizar el ratón
            if (render.mouse) {
                Mouse.setScale(render.mouse, {
                    x: (render.bounds.max.x - render.bounds.min.x) / render.canvas.width,
                    y: (render.bounds.max.y - render.bounds.min.y) / render.canvas.height
                });

                Mouse.setOffset(render.mouse, render.bounds.min);
            }
        } else {
            constraints = allConstraints;
            bodies = allBodies;
        }

        if (!options.wireframes || (engine.enableSleeping && options.showSleeping)) {
            // representación completa de cuerpos
            Render.bodies(render, bodies, context);
        } else {
            if (options.showConvexHulls)
                Render.bodyConvexHulls(render, bodies, context);

            // método optimizado solo para wireframes
            Render.bodyWireframes(render, bodies, context);
        }

        if (options.showBounds)
            Render.bodyBounds(render, bodies, context);

        if (options.showAxes || options.showAngleIndicator)
            Render.bodyAxes(render, bodies, context);
        
        if (options.showPositions)
            Render.bodyPositions(render, bodies, context);

        if (options.showVelocity)
            Render.bodyVelocity(render, bodies, context);

        if (options.showIds)
            Render.bodyIds(render, bodies, context);

        if (options.showSeparations)
            Render.separations(render, engine.pairs.list, context);

        if (options.showCollisions)
            Render.collisions(render, engine.pairs.list, context);

        if (options.showVertexNumbers)
            Render.vertexNumbers(render, bodies, context);

        if (options.showMousePosition)
            Render.mousePosition(render, render.mouse, context);

        Render.constraints(constraints, context);

        if (options.showBroadphase && engine.broadphase.controller === Grid)
            Render.grid(render, engine.broadphase, context);

        if (options.showDebug)
            Render.debug(render, context);

        if (options.hasBounds) {
            // revert view transforms
            Render.endViewTransform(render);
        }

        Events.trigger(render, 'afterRender', event);
    };

    /**
     * Descripción
     * @private
     * @method debug - depurar
     * @param {render} render - renderizar
     * @param {RenderingContext} context - contexto
     */
    Render.debug = function(render, context) {
        var c = context,
            engine = render.engine,
            world = engine.world,
            metrics = engine.metrics,
            options = render.options,
            bodies = Composite.allBodies(world),
            space = "    ";

        if (engine.timing.timestamp - (render.debugTimestamp || 0) >= 500) {
            var text = "";

            if (metrics.timing) {
                text += "fps: " + Math.round(metrics.timing.fps) + space;
            }


            render.debugString = text;
            render.debugTimestamp = engine.timing.timestamp;
        }

        if (render.debugString) {
            c.font = "12px Arial";

            if (options.wireframes) {
                c.fillStyle = 'rgba(255,255,255,0.5)';
            } else {
                c.fillStyle = 'rgba(0,0,0,0.5)';
            }

            var split = render.debugString.split('\n');

            for (var i = 0; i < split.length; i++) {
                c.fillText(split[i], 50, 50 + i * 18);
            }
        }
    };

    /**
     * Descripción
     * @private
     * @method constraints - restricciones
     * @param {constraint[]} constraints - restricciones
     * @param {RenderingContext} context - contexto 
     */
    Render.constraints = function(constraints, context) {
        var c = context;

        for (var i = 0; i < constraints.length; i++) {
            var constraint = constraints[i];

            if (!constraint.render.visible || !constraint.pointA || !constraint.pointB)
                continue;

            var bodyA = constraint.bodyA,
                bodyB = constraint.bodyB;

            if (bodyA) {
                c.beginPath();
                c.moveTo(bodyA.position.x + constraint.pointA.x, bodyA.position.y + constraint.pointA.y);
            } else {
                c.beginPath();
                c.moveTo(constraint.pointA.x, constraint.pointA.y);
            }

            if (bodyB) {
                c.lineTo(bodyB.position.x + constraint.pointB.x, bodyB.position.y + constraint.pointB.y);
            } else {
                c.lineTo(constraint.pointB.x, constraint.pointB.y);
            }

            if (constraint.render.lineWidth) {
                c.lineWidth = constraint.render.lineWidth;
                c.strokeStyle = constraint.render.strokeStyle;
                c.stroke();
            }
        }
    };
    
    /**
     * Descripción
     * @private
     * @method bodyShadows
     * @param {render} render - generar
     * @param {body[]} bodies - cuerpos
     * @param {RenderingContext} context - contexto 
     */
    Render.bodyShadows = function(render, bodies, context) {
        var c = context,
            engine = render.engine;

        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];

            if (!body.render.visible)
                continue;

            if (body.circleRadius) {
                c.beginPath();
                c.arc(body.position.x, body.position.y, body.circleRadius, 0, 2 * Math.PI);
                c.closePath();
            } else {
                c.beginPath();
                c.moveTo(body.vertices[0].x, body.vertices[0].y);
                for (var j = 1; j < body.vertices.length; j++) {
                    c.lineTo(body.vertices[j].x, body.vertices[j].y);
                }
                c.closePath();
            }

            var distanceX = body.position.x - render.options.width * 0.5,
                distanceY = body.position.y - render.options.height * 0.2,
                distance = Math.abs(distanceX) + Math.abs(distanceY);

            c.shadowColor = 'rgba(0,0,0,0.15)';
            c.shadowOffsetX = 0.05 * distanceX;
            c.shadowOffsetY = 0.05 * distanceY;
            c.shadowBlur = 1 + 12 * Math.min(1, distance / 1000);

            c.fill();

            c.shadowColor = null;
            c.shadowOffsetX = null;
            c.shadowOffsetY = null;
            c.shadowBlur = null;
        }
    };

    /**
     * Descrpición
     * @private
     * @method bodies - cuerpos
     * @param {render} render - generar
     * @param {body[]} bodies - cuerpos
     * @param {RenderingContext} context - contexto
     */
    Render.bodies = function(render, bodies, context) {
        var c = context,
            engine = render.engine,
            options = render.options,
            showInternalEdges = options.showInternalEdges || !options.wireframes,
            body,
            part,
            i,
            k;

        for (i = 0; i < bodies.length; i++) {
            body = bodies[i];

            if (!body.render.visible)
                continue;

            // manejar piezas compuestas
            for (k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
                part = body.parts[k];

                if (!part.render.visible)
                    continue;

                if (options.showSleeping && body.isSleeping) {
                    c.globalAlpha = 0.5 * part.render.opacity;
                } else if (part.render.opacity !== 1) {
                    c.globalAlpha = part.render.opacity;
                }

                if (part.render.sprite && part.render.sprite.texture && !options.wireframes) {
                    // part sprite
                    var sprite = part.render.sprite,
                        texture = _getTexture(render, sprite.texture);

                    c.translate(part.position.x, part.position.y); 
                    c.rotate(part.angle);

                    c.drawImage(
                        texture,
                        texture.width * -sprite.xOffset * sprite.xScale, 
                        texture.height * -sprite.yOffset * sprite.yScale, 
                        texture.width * sprite.xScale, 
                        texture.height * sprite.yScale
                    );

                    // revertir la traslación, con suerte más rápido que guardar / restaurar
                    c.rotate(-part.angle);
                    c.translate(-part.position.x, -part.position.y); 
                } else {
                    // polígono parcial
                    if (part.circleRadius) {
                        c.beginPath();
                        c.arc(part.position.x, part.position.y, part.circleRadius, 0, 2 * Math.PI);
                    } else {
                        c.beginPath();
                        c.moveTo(part.vertices[0].x, part.vertices[0].y);

                        for (var j = 1; j < part.vertices.length; j++) {
                            if (!part.vertices[j - 1].isInternal || showInternalEdges) {
                                c.lineTo(part.vertices[j].x, part.vertices[j].y);
                            } else {
                                c.moveTo(part.vertices[j].x, part.vertices[j].y);
                            }

                            if (part.vertices[j].isInternal && !showInternalEdges) {
                                c.moveTo(part.vertices[(j + 1) % part.vertices.length].x, part.vertices[(j + 1) % part.vertices.length].y);
                            }
                        }
                        
                        c.lineTo(part.vertices[0].x, part.vertices[0].y);
                        c.closePath();
                    }

                    if (!options.wireframes) {
                        c.fillStyle = part.render.fillStyle;

                        if (part.render.lineWidth) {
                            c.lineWidth = part.render.lineWidth;
                            c.strokeStyle = part.render.strokeStyle;
                            c.stroke();
                        }

                        c.fill();
                    } else {
                        c.lineWidth = 1;
                        c.strokeStyle = '#bbb';
                        c.stroke();
                    }
                }

                c.globalAlpha = 1;
            }
        }
    };

    /**
     * Método optimizado para dibujar estructuras alámbricas del cuerpo en una sola pasada
     * @private
     * @method bodyWireframes 
     * @param {render} render - generar
     * @param {body[]} bodies - cuerpos
     * @param {RenderingContext} context - contexto
     */
    Render.bodyWireframes = function(render, bodies, context) {
        var c = context,
            showInternalEdges = render.options.showInternalEdges,
            body,
            part,
            i,
            j,
            k;

        c.beginPath();

        // generar todos los cuerpos
        for (i = 0; i < bodies.length; i++) {
            body = bodies[i];

            if (!body.render.visible)
                continue;

            // manejar piezas compuestas
            for (k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
                part = body.parts[k];

                c.moveTo(part.vertices[0].x, part.vertices[0].y);

                for (j = 1; j < part.vertices.length; j++) {
                    if (!part.vertices[j - 1].isInternal || showInternalEdges) {
                        c.lineTo(part.vertices[j].x, part.vertices[j].y);
                    } else {
                        c.moveTo(part.vertices[j].x, part.vertices[j].y);
                    }

                    if (part.vertices[j].isInternal && !showInternalEdges) {
                        c.moveTo(part.vertices[(j + 1) % part.vertices.length].x, part.vertices[(j + 1) % part.vertices.length].y);
                    }
                }
                
                c.lineTo(part.vertices[0].x, part.vertices[0].y);
            }
        }

        c.lineWidth = 1;
        c.strokeStyle = '#bbb';
        c.stroke();
    };

    /**
     * Método optimizado para dibujar estructuras de alambre de envolvente convexo del cuerpo en una sola pasada
     * @private
     * @method bodyConvexHulls
     * @param {render} render - generar
     * @param {body[]} bodies - cuerpos
     * @param {RenderingContext} context - contexto
     */
    Render.bodyConvexHulls = function(render, bodies, context) {
        var c = context,
            body,
            part,
            i,
            j,
            k;

        c.beginPath();

        // generar envolventes convexos
        for (i = 0; i < bodies.length; i++) {
            body = bodies[i];

            if (!body.render.visible || body.parts.length === 1)
                continue;

            c.moveTo(body.vertices[0].x, body.vertices[0].y);

            for (j = 1; j < body.vertices.length; j++) {
                c.lineTo(body.vertices[j].x, body.vertices[j].y);
            }
            
            c.lineTo(body.vertices[0].x, body.vertices[0].y);
        }

        c.lineWidth = 1;
        c.strokeStyle = 'rgba(255,255,255,0.2)';
        c.stroke();
    };

    /**
     * Representa los números de vértice del cuerpo.
     * @private
     * @method vertexNumbers
     * @param {render} render - representa
     * @param {body[]} bodies - cuerpos
     * @param {RenderingContext} context - contexto
     */
    Render.vertexNumbers = function(render, bodies, context) {
        var c = context,
            i,
            j,
            k;

        for (i = 0; i < bodies.length; i++) {
            var parts = bodies[i].parts;
            for (k = parts.length > 1 ? 1 : 0; k < parts.length; k++) {
                var part = parts[k];
                for (j = 0; j < part.vertices.length; j++) {
                    c.fillStyle = 'rgba(255,255,255,0.2)';
                    c.fillText(i + '_' + j, part.position.x + (part.vertices[j].x - part.position.x) * 0.8, part.position.y + (part.vertices[j].y - part.position.y) * 0.8);
                }
            }
        }
    };

    /**
     * Representa la posición del ratón.
     * @private
     * @method mousePosition 
     * @param {render} render - renderizar
     * @param {mouse} mouse - ratón
     * @param {RenderingContext} context - contexto
     */
    Render.mousePosition = function(render, mouse, context) {
        var c = context;
        c.fillStyle = 'rgba(255,255,255,0.8)';
        c.fillText(mouse.position.x + '  ' + mouse.position.y, mouse.position.x + 5, mouse.position.y - 5);
    };

    /**
     * Dibuja los límites del cuerpo
     * @private
     * @method bodyBounds 
     * @param {render} render - renderizar
     * @param {body[]} bodies - cuerpos
     * @param {RenderingContext} context - contexto
     */
    Render.bodyBounds = function(render, bodies, context) {
        var c = context,
            engine = render.engine,
            options = render.options;

        c.beginPath();

        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];

            if (body.render.visible) {
                var parts = bodies[i].parts;
                for (var j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
                    var part = parts[j];
                    c.rect(part.bounds.min.x, part.bounds.min.y, part.bounds.max.x - part.bounds.min.x, part.bounds.max.y - part.bounds.min.y);
                }
            }
        }

        if (options.wireframes) {
            c.strokeStyle = 'rgba(255,255,255,0.08)';
        } else {
            c.strokeStyle = 'rgba(0,0,0,0.1)';
        }

        c.lineWidth = 1;
        c.stroke();
    };

    /**
     * Dibuja ejes e indicadores de ángulo del cuerpo
     * @private
     * @method bodyAxes 
     * @param {render} render - representar
     * @param {body[]} bodies - cuerpos
     * @param {RenderingContext} context - contexto 
     */
    Render.bodyAxes = function(render, bodies, context) {
        var c = context,
            engine = render.engine,
            options = render.options,
            part,
            i,
            j,
            k;

        c.beginPath();

        for (i = 0; i < bodies.length; i++) {
            var body = bodies[i],
                parts = body.parts;

            if (!body.render.visible)
                continue;

            if (options.showAxes) {
                // representar todos los ejes
                for (j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
                    part = parts[j];
                    for (k = 0; k < part.axes.length; k++) {
                        var axis = part.axes[k];
                        c.moveTo(part.position.x, part.position.y);
                        c.lineTo(part.position.x + axis.x * 20, part.position.y + axis.y * 20);
                    }
                }
            } else {
                for (j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
                    part = parts[j];
                    for (k = 0; k < part.axes.length; k++) {
                        // render a single axis indicator
                        c.moveTo(part.position.x, part.position.y);
                        c.lineTo((part.vertices[0].x + part.vertices[part.vertices.length-1].x) / 2, 
                                 (part.vertices[0].y + part.vertices[part.vertices.length-1].y) / 2);
                    }
                }
            }
        }

        if (options.wireframes) {
            c.strokeStyle = 'indianred';
            c.lineWidth = 1;
        } else {
            c.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            c.globalCompositeOperation = 'overlay';
            c.lineWidth = 2;
        }

        c.stroke();
        c.globalCompositeOperation = 'source-over';
    };

    /**
     *Dibuja posiciones corporales
     * @private
     * @method bodyPositions 
     * @param {render} render - representar
     * @param {body[]} bodies - cuerpos
     * @param {RenderingContext} context - contexto
     */
    Render.bodyPositions = function(render, bodies, context) {
        var c = context,
            engine = render.engine,
            options = render.options,
            body,
            part,
            i,
            k;

        c.beginPath();

        // representar posiciones actuales
        for (i = 0; i < bodies.length; i++) {
            body = bodies[i];

            if (!body.render.visible)
                continue;

            // manejar piezas compuestas
            for (k = 0; k < body.parts.length; k++) {
                part = body.parts[k];
                c.arc(part.position.x, part.position.y, 3, 0, 2 * Math.PI, false);
                c.closePath();
            }
        }

        if (options.wireframes) {
            c.fillStyle = 'indianred';
        } else {
            c.fillStyle = 'rgba(0,0,0,0.5)';
        }
        c.fill();

        c.beginPath();

        // representar posiciones anteriores
        for (i = 0; i < bodies.length; i++) {
            body = bodies[i];
            if (body.render.visible) {
                c.arc(body.positionPrev.x, body.positionPrev.y, 2, 0, 2 * Math.PI, false);
                c.closePath();
            }
        }

        c.fillStyle = 'rgba(255,165,0,0.8)';
        c.fill();
    };

    /**
     * Dibuja la velocidad del cuerpo
     * @private
     * @method bodyVelocity
     * @param {render} render - renderizar
     * @param {body[]} bodies - cuerpos
     * @param {RenderingContext} context - contexto
     */
    Render.bodyVelocity = function(render, bodies, context) {
        var c = context;

        c.beginPath();

        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];

            if (!body.render.visible)
                continue;

            c.moveTo(body.position.x, body.position.y);
            c.lineTo(body.position.x + (body.position.x - body.positionPrev.x) * 2, body.position.y + (body.position.y - body.positionPrev.y) * 2);
        }

        c.lineWidth = 3;
        c.strokeStyle = 'cornflowerblue';
        c.stroke();
    };

    /**
     * Dibuja identificaciones corporales
     * @private
     * @method bodyIds 
     * @param {render} render - representar
     * @param {body[]} bodies - cuerpos
     * @param {RenderingContext} context - contexto
     */
    Render.bodyIds = function(render, bodies, context) {
        var c = context,
            i,
            j;

        for (i = 0; i < bodies.length; i++) {
            if (!bodies[i].render.visible)
                continue;

            var parts = bodies[i].parts;
            for (j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
                var part = parts[j];
                c.font = "12px Arial";
                c.fillStyle = 'rgba(255,255,255,0.5)';
                c.fillText(part.id, part.position.x + 10, part.position.y - 10);
            }
        }
    };

    /**
     * Descripción
     * @private
     * @method collisions - colisiones
     * @param {render} render - representar
     * @param {pair[]} pairs - pares
     * @param {RenderingContext} context - contexto
     */
    Render.collisions = function(render, pairs, context) {
        var c = context,
            options = render.options,
            pair,
            collision,
            corrected,
            bodyA,
            bodyB,
            i,
            j;

        c.beginPath();

        // representar posiciones de colisión
        for (i = 0; i < pairs.length; i++) {
            pair = pairs[i];

            if (!pair.isActive)
                continue;

            collision = pair.collision;
            for (j = 0; j < pair.activeContacts.length; j++) {
                var contact = pair.activeContacts[j],
                    vertex = contact.vertex;
                c.rect(vertex.x - 1.5, vertex.y - 1.5, 3.5, 3.5);
            }
        }

        if (options.wireframes) {
            c.fillStyle = 'rgba(255,255,255,0.7)';
        } else {
            c.fillStyle = 'orange';
        }
        c.fill();

        c.beginPath();
            
        // representarar normales de colisión
        for (i = 0; i < pairs.length; i++) {
            pair = pairs[i];

            if (!pair.isActive)
                continue;

            collision = pair.collision;

            if (pair.activeContacts.length > 0) {
                var normalPosX = pair.activeContacts[0].vertex.x,
                    normalPosY = pair.activeContacts[0].vertex.y;

                if (pair.activeContacts.length === 2) {
                    normalPosX = (pair.activeContacts[0].vertex.x + pair.activeContacts[1].vertex.x) / 2;
                    normalPosY = (pair.activeContacts[0].vertex.y + pair.activeContacts[1].vertex.y) / 2;
                }
                
                if (collision.bodyB === collision.supports[0].body || collision.bodyA.isStatic === true) {
                    c.moveTo(normalPosX - collision.normal.x * 8, normalPosY - collision.normal.y * 8);
                } else {
                    c.moveTo(normalPosX + collision.normal.x * 8, normalPosY + collision.normal.y * 8);
                }

                c.lineTo(normalPosX, normalPosY);
            }
        }

        if (options.wireframes) {
            c.strokeStyle = 'rgba(255,165,0,0.7)';
        } else {
            c.strokeStyle = 'orange';
        }

        c.lineWidth = 1;
        c.stroke();
    };

    /**
     * Description
     * @private
     * @method separations - separaciones
     * @param {render} render - representar
     * @param {pair[]} pairs - pares
     * @param {RenderingContext} context - contexto
     */
    Render.separations = function(render, pairs, context) {
        var c = context,
            options = render.options,
            pair,
            collision,
            corrected,
            bodyA,
            bodyB,
            i,
            j;

        c.beginPath();

        // representar separaciones
        for (i = 0; i < pairs.length; i++) {
            pair = pairs[i];

            if (!pair.isActive)
                continue;

            collision = pair.collision;
            bodyA = collision.bodyA;
            bodyB = collision.bodyB;

            var k = 1;

            if (!bodyB.isStatic && !bodyA.isStatic) k = 0.5;
            if (bodyB.isStatic) k = 0;

            c.moveTo(bodyB.position.x, bodyB.position.y);
            c.lineTo(bodyB.position.x - collision.penetration.x * k, bodyB.position.y - collision.penetration.y * k);

            k = 1;

            if (!bodyB.isStatic && !bodyA.isStatic) k = 0.5;
            if (bodyA.isStatic) k = 0;

            c.moveTo(bodyA.position.x, bodyA.position.y);
            c.lineTo(bodyA.position.x + collision.penetration.x * k, bodyA.position.y + collision.penetration.y * k);
        }

        if (options.wireframes) {
            c.strokeStyle = 'rgba(255,165,0,0.5)';
        } else {
            c.strokeStyle = 'orange';
        }
        c.stroke();
    };

    /**
     * Descripción
     * @private
     * @method grid - cuadricula
     * @param {render} render - renderizar
     * @param {grid} grid - cuadricula
     * @param {RenderingContext} context - contexto
     */
    Render.grid = function(render, grid, context) {
        var c = context,
            options = render.options;

        if (options.wireframes) {
            c.strokeStyle = 'rgba(255,180,0,0.1)';
        } else {
            c.strokeStyle = 'rgba(255,180,0,0.5)';
        }

        c.beginPath();

        var bucketKeys = Common.keys(grid.buckets);

        for (var i = 0; i < bucketKeys.length; i++) {
            var bucketId = bucketKeys[i];

            if (grid.buckets[bucketId].length < 2)
                continue;

            var region = bucketId.split(/C|R/);
            c.rect(0.5 + parseInt(region[1], 10) * grid.bucketWidth, 
                    0.5 + parseInt(region[2], 10) * grid.bucketHeight, 
                    grid.bucketWidth, 
                    grid.bucketHeight);
        }

        c.lineWidth = 1;
        c.stroke();
    };

    /**
     * Descripción
     * @private
     * @method inspector - inspector
     * @param {inspector} inspector - inspector
     * @param {RenderingContext} context - contexto 
     */
    Render.inspector = function(inspector, context) {
        var engine = inspector.engine,
            selected = inspector.selected,
            render = inspector.render,
            options = render.options,
            bounds;

        if (options.hasBounds) {
            var boundsWidth = render.bounds.max.x - render.bounds.min.x,
                boundsHeight = render.bounds.max.y - render.bounds.min.y,
                boundsScaleX = boundsWidth / render.options.width,
                boundsScaleY = boundsHeight / render.options.height;
            
            context.scale(1 / boundsScaleX, 1 / boundsScaleY);
            context.translate(-render.bounds.min.x, -render.bounds.min.y);
        }

        for (var i = 0; i < selected.length; i++) {
            var item = selected[i].data;

            context.translate(0.5, 0.5);
            context.lineWidth = 1;
            context.strokeStyle = 'rgba(255,165,0,0.9)';
            context.setLineDash([1,2]);

            switch (item.type) {

            case 'body':

                // renderizar selecciones de cuerpo
                bounds = item.bounds;
                context.beginPath();
                context.rect(Math.floor(bounds.min.x - 3), Math.floor(bounds.min.y - 3), 
                             Math.floor(bounds.max.x - bounds.min.x + 6), Math.floor(bounds.max.y - bounds.min.y + 6));
                context.closePath();
                context.stroke();

                break;

            case 'constraint':

                // representar selecciones de restricciones
                var point = item.pointA;
                if (item.bodyA)
                    point = item.pointB;
                context.beginPath();
                context.arc(point.x, point.y, 10, 0, 2 * Math.PI);
                context.closePath();
                context.stroke();

                break;

            }

            context.setLineDash([]);
            context.translate(-0.5, -0.5);
        }

        // representar región de selección
        if (inspector.selectStart !== null) {
            context.translate(0.5, 0.5);
            context.lineWidth = 1;
            context.strokeStyle = 'rgba(255,165,0,0.6)';
            context.fillStyle = 'rgba(255,165,0,0.1)';
            bounds = inspector.selectBounds;
            context.beginPath();
            context.rect(Math.floor(bounds.min.x), Math.floor(bounds.min.y), 
                         Math.floor(bounds.max.x - bounds.min.x), Math.floor(bounds.max.y - bounds.min.y));
            context.closePath();
            context.stroke();
            context.fill();
            context.translate(-0.5, -0.5);
        }

        if (options.hasBounds)
            context.setTransform(1, 0, 0, 1, 0, 0);
    };

    /**
     * Descripción
     * @method _createCanvas
     * @private
     * @param {} width - ancho
     * @param {} height - alto
     * @return canvas - lienzo
     */
    var _createCanvas = function(width, height) {
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.oncontextmenu = function() { return false; };
        canvas.onselectstart = function() { return false; };
        return canvas;
    };

    /**
     * Obten la proporción de píxeles del lienzo.
     * @method _getPixelRatio
     * @private
     * @param {HTMLElement} canvas - lienzo
     * @return {Number} pixel ratio - proporción del pixel
     */
    var _getPixelRatio = function(canvas) {
        var context = canvas.getContext('2d'),
            devicePixelRatio = window.devicePixelRatio || 1,
            backingStorePixelRatio = context.webkitBackingStorePixelRatio || context.mozBackingStorePixelRatio
                                      || context.msBackingStorePixelRatio || context.oBackingStorePixelRatio
                                      || context.backingStorePixelRatio || 1;

        return devicePixelRatio / backingStorePixelRatio;
    };

    /**
     * Obten la textura solicitada (una imagen) a través de su ruta
     * @method _getTexture
     * @private
     * @param {render} render - renderizar
     * @param {string} imagePath 
     * @return {Image} texture - textura
     */
    var _getTexture = function(render, imagePath) {
        var image = render.textures[imagePath];

        if (image)
            return image;

        image = render.textures[imagePath] = new Image();
        image.src = imagePath;

        return image;
    };

    /**
     * Aplica el fondo al lienzo mediante CSS.
     * @method applyBackground
     * @private
     * @param {render} render - renderizar
     * @param {string} background - fondo
     */
    var _applyBackground = function(render, background) {
        var cssBackground = background;

        if (/(jpg|gif|png)$/.test(background))
            cssBackground = 'url(' + background + ')';

        render.canvas.style.background = cssBackground;
        render.canvas.style.backgroundSize = "contain";
        render.currentBackground = background;
    };

    /*
    *
    *  Documentación de eventos
    *
    */

    /**
    * Disparado antes de representar
    *
    * @event beforeRender
    * @param {} event Un objeto de evento
    * @param {number} event.timestamp El engine.timing.timestamp del evento
    * @param {} event.source El objeto fuente del evento
    * @param {} event.name El nombre del evento
    */

    /**
    * Disparado después de representar
    *
    * @event afterRender
    * @param {} event Un objeto de evento
    * @param {number} event.timestamp El engine.timing.timestamp del evento
    * @param {} event.source El objeto fuente del evento
    * @param {} event.name El nombre del evento
    */

    /*
    *
    *  Documentación de propiedades
    *
    */

    /**
     * Una referencia al módulo `Matter.Render`.
     *
     * @property controller - controlador
     * @type render - renderizar
     */

    /**
     * Una referencia a la instancia de `Matter.Engine` que se utilizará.
     *
     * @property engine - motor
     * @type engine - motor
     */

    /**
     * Una referencia al elemento donde se insertará el lienzo (si no se ha especificado `render.canvas`)
     *
     * @property element - elemento
     * @type HTMLElement
     * @default null - nulo
     */

    /**
     * El elemento de lienzo al que se va a renderizar. Si no se especifica, se creará uno si se ha especificado `render.element`.
     *
     * @property canvas - lienzo
     * @type HTMLCanvasElement 
     * @default null - nulo
     */

    /**
     * Las opciones de configuración del representador.
     *
     * @property options - opciones
     * @type {}
     */

    /**
     * El ancho deseado en píxeles del `render.canvas` que se va a crear.
     *
     * @property options.width
     * @type number - número
     * @default 800
     */

    /**
     * La altura deseada en píxeles del `render.canvas` que se va a crear.
     *
     * @property options.height
     * @type number - número
     * @default 600
     */

    /**
     * Una marcaa que especifica si se debe usar `render.bounds` al representar.
     *
     * @property options.hasBounds
     * @type boolean - booleano
     * @default false - falso
     */

    /**
     * Un objeto "Límites" que especifica la región de la vista de dibujo. 
     * El renderizado se transformará y escalará automáticamente para ajustarse al tamaño del lienzo (`render.options.width` y `render.options.height`).
     * Esto permite crear vistas que pueden desplazarse o hacer zoom alrededor de la escena.
     * También debe establecer `render.options.hasBounds` en` true` para habilitar la representación limitada.
     *
     * @property bounds - límites
     * @type bounds - límites
     */

    /**
     * El contexto de renderizado 2d del elemento `render.canvas`.
     *
     * @property context - contexto
     * @type CanvasRenderingContext2D
     */

    /**
     * El caché de texturas de sprites.
     *
     * @property textures - texturas
     * @type {}
     */

})();

},{"../body/Composite":2,"../collision/Grid":6,"../core/Common":14,"../core/Events":16,"../core/Mouse":19,"../geometry/Bounds":26,"../geometry/Vector":28}],32:[function(_dereq_,module,exports){
/**
* El módulo `Matter.RenderPixi` es un representador de ejemplo que utiliza pixi.js.
* Ve también `Matter.Render` para un representador basado en lienzo.
*
* @class RenderPixi
* @deprecated the Matter.RenderPixi module will soon be removed from the Matter.js core. - el módulo Matter.RenderPixi pronto se eliminará del núcleo de Matter.js.
* Es probable que se mueva a su propio repositorio (pero el mantenimiento será limitado).
*/

var RenderPixi = {};

module.exports = RenderPixi;

var Bounds = _dereq_('../geometry/Bounds');
var Composite = _dereq_('../body/Composite');
var Common = _dereq_('../core/Common');
var Events = _dereq_('../core/Events');
var Vector = _dereq_('../geometry/Vector');

(function() {

    var _requestAnimationFrame,
        _cancelAnimationFrame;

    if (typeof window !== 'undefined') {
        _requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame
                                      || window.mozRequestAnimationFrame || window.msRequestAnimationFrame 
                                      || function(callback){ window.setTimeout(function() { callback(Common.now()); }, 1000 / 60); };
   
        _cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame 
                                      || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;
    }
    
    /**
     * Crea un nuevo renderizador Pixi.js WebGL
     * @method create - crear
     * @param {object} options - opciones
     * @return {RenderPixi} A new renderer - un nuevo renderizador
     * @deprecated
     */
    RenderPixi.create = function(options) {
        Common.warn('RenderPixi.create: Matter.RenderPixi is deprecated (see docs)');

        var defaults = {
            controller: RenderPixi,
            engine: null,
            element: null,
            frameRequestId: null,
            canvas: null,
            renderer: null,
            container: null,
            spriteContainer: null,
            pixiOptions: null,
            options: {
                width: 800,
                height: 600,
                background: '#fafafa',
                wireframeBackground: '#222',
                hasBounds: false,
                enabled: true,
                wireframes: true,
                showSleeping: true,
                showDebug: false,
                showBroadphase: false,
                showBounds: false,
                showVelocity: false,
                showCollisions: false,
                showAxes: false,
                showPositions: false,
                showAngleIndicator: false,
                showIds: false,
                showShadows: false
            }
        };

        var render = Common.extend(defaults, options),
            transparent = !render.options.wireframes && render.options.background === 'transparent';

        // init pixi
        render.pixiOptions = render.pixiOptions || {
            view: render.canvas,
            transparent: transparent,
            antialias: true,
            backgroundColor: options.background
        };

        render.mouse = options.mouse;
        render.engine = options.engine;
        render.renderer = render.renderer || new PIXI.WebGLRenderer(render.options.width, render.options.height, render.pixiOptions);
        render.container = render.container || new PIXI.Container();
        render.spriteContainer = render.spriteContainer || new PIXI.Container();
        render.canvas = render.canvas || render.renderer.view;
        render.bounds = render.bounds || { 
            min: {
                x: 0,
                y: 0
            }, 
            max: { 
                x: render.options.width,
                y: render.options.height
            }
        };

        // oyentes de eventos
        Events.on(render.engine, 'beforeUpdate', function() {
            RenderPixi.clear(render);
        });

        // caches
        render.textures = {};
        render.sprites = {};
        render.primitives = {};

        // usar un lote de sprites para el rendimiento
        render.container.addChild(render.spriteContainer);

        // insertar lienzo
        if (Common.isElement(render.element)) {
            render.element.appendChild(render.canvas);
        } else {
            Common.warn('No "render.element" passed, "render.canvas" was not inserted into document.');
        }

        // evitar menús en lienzo
        render.canvas.oncontextmenu = function() { return false; };
        render.canvas.onselectstart = function() { return false; };

        return render;
    };

    /**
     * Actualiza continuamente el lienzo de renderizado en el evento `requestAnimationFrame`.
     * @method run - reproducir
     * @param {render} render - renderizar
     * @deprecated
     */
    RenderPixi.run = function(render) {
        (function loop(time){
            render.frameRequestId = _requestAnimationFrame(loop);
            RenderPixi.world(render);
        })();
    };

    /**
     * Finaliza la ejecución de `Render.run` en el `render` dado, cancelando el bucle de evento de solicitud de cuadro de animación.
     * @method stop - parar
     * @param {render} render - renderizar
     * @deprecated
     */
    RenderPixi.stop = function(render) {
        _cancelAnimationFrame(render.frameRequestId);
    };

    /**
     * Borra el gráfico de la escena
     * @method clear - despejar
     * @param {RenderPixi} render - renderrizar
     * @deprecated
     */
    RenderPixi.clear = function(render) {
        var container = render.container,
            spriteContainer = render.spriteContainer;

        // contenedor de escenario transparente
        while (container.children[0]) { 
            container.removeChild(container.children[0]); 
        }

        // lote de sprites despejado
        while (spriteContainer.children[0]) { 
            spriteContainer.removeChild(spriteContainer.children[0]); 
        }

        var bgSprite = render.sprites['bg-0'];

        // despejar caches
        render.textures = {};
        render.sprites = {};
        render.primitives = {};

        // establecer sprite de fondo
        render.sprites['bg-0'] = bgSprite;
        if (bgSprite)
            container.addChildAt(bgSprite, 0);

        // agregue el lote de sprites nuevamente en el contenedor
        render.container.addChild(render.spriteContainer);

        // restablecer el estado de fondo
        render.currentBackground = null;

        // restablecer las transformaciones de límites
        container.scale.set(1, 1);
        container.position.set(0, 0);
    };

    /**
     *Establece el fondo del lienzo. 
     * @method setBackground 
     * @param {RenderPixi} render - renderizar
     * @param {string} background - fondo
     * @deprecated
     */
    RenderPixi.setBackground = function(render, background) {
        if (render.currentBackground !== background) {
            var isColor = background.indexOf && background.indexOf('#') !== -1,
                bgSprite = render.sprites['bg-0'];

            if (isColor) {
                // si el color de fondo es sólido
                var color = Common.colorToNumber(background);
                render.renderer.backgroundColor = color;

                // eliminar sprite de fondo si existe
                if (bgSprite)
                    render.container.removeChild(bgSprite); 
            } else {
                // inicializar el sprite de fondo si es necesario
                if (!bgSprite) {
                    var texture = _getTexture(render, background);

                    bgSprite = render.sprites['bg-0'] = new PIXI.Sprite(texture);
                    bgSprite.position.x = 0;
                    bgSprite.position.y = 0;
                    render.container.addChildAt(bgSprite, 0);
                }
            }

            render.currentBackground = background;
        }
    };

    /**
     * Descripción
     * @method world - mundo
     * @param {engine} engine - motor
     * @deprecated
     */
    RenderPixi.world = function(render) {
        var engine = render.engine,
            world = engine.world,
            renderer = render.renderer,
            container = render.container,
            options = render.options,
            bodies = Composite.allBodies(world),
            allConstraints = Composite.allConstraints(world),
            constraints = [],
            i;

        if (options.wireframes) {
            RenderPixi.setBackground(render, options.wireframeBackground);
        } else {
            RenderPixi.setBackground(render, options.background);
        }

        // manejar límites
        var boundsWidth = render.bounds.max.x - render.bounds.min.x,
            boundsHeight = render.bounds.max.y - render.bounds.min.y,
            boundsScaleX = boundsWidth / render.options.width,
            boundsScaleY = boundsHeight / render.options.height;

        if (options.hasBounds) {
            // Ocultar cuerpos que no están a la vista
            for (i = 0; i < bodies.length; i++) {
                var body = bodies[i];
                body.render.sprite.visible = Bounds.overlaps(body.bounds, render.bounds);
            }

            // filtrar las restricciones que no están a la vista
            for (i = 0; i < allConstraints.length; i++) {
                var constraint = allConstraints[i],
                    bodyA = constraint.bodyA,
                    bodyB = constraint.bodyB,
                    pointAWorld = constraint.pointA,
                    pointBWorld = constraint.pointB;

                if (bodyA) pointAWorld = Vector.add(bodyA.position, constraint.pointA);
                if (bodyB) pointBWorld = Vector.add(bodyB.position, constraint.pointB);

                if (!pointAWorld || !pointBWorld)
                    continue;

                if (Bounds.contains(render.bounds, pointAWorld) || Bounds.contains(render.bounds, pointBWorld))
                    constraints.push(constraint);
            }

            // transformar la vista
            container.scale.set(1 / boundsScaleX, 1 / boundsScaleY);
            container.position.set(-render.bounds.min.x * (1 / boundsScaleX), -render.bounds.min.y * (1 / boundsScaleY));
        } else {
            constraints = allConstraints;
        }

        for (i = 0; i < bodies.length; i++)
            RenderPixi.body(render, bodies[i]);

        for (i = 0; i < constraints.length; i++)
            RenderPixi.constraint(render, constraints[i]);

        renderer.render(container);
    };


    /**
     * Descripción
     * @method constraint - restricción
     * @param {engine} engine - motor
     * @param {constraint} constraint - restricción
     * @deprecated
     */
    RenderPixi.constraint = function(render, constraint) {
        var engine = render.engine,
            bodyA = constraint.bodyA,
            bodyB = constraint.bodyB,
            pointA = constraint.pointA,
            pointB = constraint.pointB,
            container = render.container,
            constraintRender = constraint.render,
            primitiveId = 'c-' + constraint.id,
            primitive = render.primitives[primitiveId];

        // inicializar la primitiva de restricción si no existe
        if (!primitive)
            primitive = render.primitives[primitiveId] = new PIXI.Graphics();

        // no renderizar si la restricción no tiene dos puntos finales
        if (!constraintRender.visible || !constraint.pointA || !constraint.pointB) {
            primitive.clear();
            return;
        }

        // agregar al gráfico de escena si aún no está allí
        if (Common.indexOf(container.children, primitive) === -1)
            container.addChild(primitive);

        // representar la restricción en cada actualización, ya que pueden cambiar dinámicamente
        primitive.clear();
        primitive.beginFill(0, 0);
        primitive.lineStyle(constraintRender.lineWidth, Common.colorToNumber(constraintRender.strokeStyle), 1);
        
        if (bodyA) {
            primitive.moveTo(bodyA.position.x + pointA.x, bodyA.position.y + pointA.y);
        } else {
            primitive.moveTo(pointA.x, pointA.y);
        }

        if (bodyB) {
            primitive.lineTo(bodyB.position.x + pointB.x, bodyB.position.y + pointB.y);
        } else {
            primitive.lineTo(pointB.x, pointB.y);
        }

        primitive.endFill();
    };
    
    /**
     * Descripción
     * @method body - cuerpo
     * @param {engine} engine - motor
     * @param {body} body - cuerpo
     * @deprecated
     */
    RenderPixi.body = function(render, body) {
        var engine = render.engine,
            bodyRender = body.render;

        if (!bodyRender.visible)
            return;

        if (bodyRender.sprite && bodyRender.sprite.texture) {
            var spriteId = 'b-' + body.id,
                sprite = render.sprites[spriteId],
                spriteContainer = render.spriteContainer;

            // inicializar cuerpo sprite si no existe
            if (!sprite)
                sprite = render.sprites[spriteId] = _createBodySprite(render, body);

            // agregar al gráfico de escena si aún no está allí
            if (Common.indexOf(spriteContainer.children, sprite) === -1)
                spriteContainer.addChild(sprite);

            // actualizar cuerpo sprite
            sprite.position.x = body.position.x;
            sprite.position.y = body.position.y;
            sprite.rotation = body.angle;
            sprite.scale.x = bodyRender.sprite.xScale || 1;
            sprite.scale.y = bodyRender.sprite.yScale || 1;
        } else {
            var primitiveId = 'b-' + body.id,
                primitive = render.primitives[primitiveId],
                container = render.container;

            // inicializar cuerpo primitivo si no existe
            if (!primitive) {
                primitive = render.primitives[primitiveId] = _createBodyPrimitive(render, body);
                primitive.initialAngle = body.angle;
            }

            // agregar al gráfico de escena si aún no está allí
            if (Common.indexOf(container.children, primitive) === -1)
                container.addChild(primitive);

            // actualizar cuerpo primitivo
            primitive.position.x = body.position.x;
            primitive.position.y = body.position.y;
            primitive.rotation = body.angle - primitive.initialAngle;
        }
    };

    /**
     * Crea un sprite corporal
     * @method _createBodySprite
     * @private
     * @param {RenderPixi} render - renderizar
     * @param {body} body - cuerpo
     * @return {PIXI.Sprite} sprite
     * @deprecated
     */
    var _createBodySprite = function(render, body) {
        var bodyRender = body.render,
            texturePath = bodyRender.sprite.texture,
            texture = _getTexture(render, texturePath),
            sprite = new PIXI.Sprite(texture);

        sprite.anchor.x = body.render.sprite.xOffset;
        sprite.anchor.y = body.render.sprite.yOffset;

        return sprite;
    };

    /**
     * Crea un cuerpo primitivo
     * @method _createBodyPrimitive
     * @private
     * @param {RenderPixi} render - renderizar
     * @param {body} body - cuerpo
     * @return {PIXI.Graphics} graphics - graficos
     * @deprecated
     */
    var _createBodyPrimitive = function(render, body) {
        var bodyRender = body.render,
            options = render.options,
            primitive = new PIXI.Graphics(),
            fillStyle = Common.colorToNumber(bodyRender.fillStyle),
            strokeStyle = Common.colorToNumber(bodyRender.strokeStyle),
            strokeStyleIndicator = Common.colorToNumber(bodyRender.strokeStyle),
            strokeStyleWireframe = Common.colorToNumber('#bbb'),
            strokeStyleWireframeIndicator = Common.colorToNumber('#CD5C5C'),
            part;

        primitive.clear();

        // manejar piezas compuestas
        for (var k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
            part = body.parts[k];

            if (!options.wireframes) {
                primitive.beginFill(fillStyle, 1);
                primitive.lineStyle(bodyRender.lineWidth, strokeStyle, 1);
            } else {
                primitive.beginFill(0, 0);
                primitive.lineStyle(1, strokeStyleWireframe, 1);
            }

            primitive.moveTo(part.vertices[0].x - body.position.x, part.vertices[0].y - body.position.y);

            for (var j = 1; j < part.vertices.length; j++) {
                primitive.lineTo(part.vertices[j].x - body.position.x, part.vertices[j].y - body.position.y);
            }

            primitive.lineTo(part.vertices[0].x - body.position.x, part.vertices[0].y - body.position.y);

            primitive.endFill();

            // indicador de ángulo
            if (options.showAngleIndicator || options.showAxes) {
                primitive.beginFill(0, 0);

                if (options.wireframes) {
                    primitive.lineStyle(1, strokeStyleWireframeIndicator, 1);
                } else {
                    primitive.lineStyle(1, strokeStyleIndicator);
                }

                primitive.moveTo(part.position.x - body.position.x, part.position.y - body.position.y);
                primitive.lineTo(((part.vertices[0].x + part.vertices[part.vertices.length-1].x) / 2 - body.position.x), 
                                 ((part.vertices[0].y + part.vertices[part.vertices.length-1].y) / 2 - body.position.y));

                primitive.endFill();
            }
        }

        return primitive;
    };

    /**
     * Obten la textura solicitada (una PIXI.Texture) a través de su ruta
     * @method _getTexture
     * @private
     * @param {RenderPixi} render - renderizar
     * @param {string} imagePath 
     * @return {PIXI.Texture} texture - textura
     * @deprecated	
     */
    var _getTexture = function(render, imagePath) {
        var texture = render.textures[imagePath];

        if (!texture)
            texture = render.textures[imagePath] = PIXI.Texture.fromImage(imagePath);

        return texture;
    };

})();

},{"../body/Composite":2,"../core/Common":14,"../core/Events":16,"../geometry/Bounds":26,"../geometry/Vector":28}]},{},[30])(30)
});
