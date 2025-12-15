"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Category = void 0;
const typeorm_1 = require("typeorm");
const product_entity_1 = require("../../products/entities/product.entity");
let Category = class Category {
    id;
    name;
    slug;
    description = null;
    icon = null;
    sortOrder;
    isActive;
    /**
     * Родительская категория
     * null для корневых категорий
     */
    parent = null;
    /**
     * Дочерние категории
     * Инициализируется как пустой массив, TypeORM заполнит при загрузке
     */
    children;
    /**
     * Товары в этой категории
     * Инициализируется как пустой массив, TypeORM заполнит при загрузке
     */
    products;
    createdAt;
    updatedAt;
};
exports.Category = Category;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Category.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 120 }),
    __metadata("design:type", String)
], Category.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150, unique: true }),
    __metadata("design:type", String)
], Category.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Category.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Category.prototype, "icon", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Category.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Category.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Category, (category) => category.children, {
        nullable: true,
        onDelete: 'SET NULL',
    }),
    __metadata("design:type", Category)
], Category.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Category, (category) => category.parent),
    __metadata("design:type", Array)
], Category.prototype, "children", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => product_entity_1.Product, (product) => product.category),
    __metadata("design:type", Array)
], Category.prototype, "products", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Category.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Category.prototype, "updatedAt", void 0);
exports.Category = Category = __decorate([
    (0, typeorm_1.Entity)('categories')
], Category);
//# sourceMappingURL=category.entity.js.map