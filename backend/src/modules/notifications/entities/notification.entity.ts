import {
Entity,
PrimaryGeneratedColumn,
Column,
CreateDateColumn
} from "typeorm";

@Entity("notifications")
export class Notification{

@PrimaryGeneratedColumn()
id!:number;

@Column("uuid")
userId!: string;

@Column()
type!:string;

@Column()
title!:string;

@Column()
message!:string;

@Column({
default:false
})
isRead!:boolean;

@CreateDateColumn()
createdAt!:Date;

}