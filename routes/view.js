"use strict";

const express = require('express');
const routes = express.Router();

module.exports = (knex) => {

  routes.get("/", (req, res) => {
    knex("users").select("*").where("id", '=', req.session.userId ).then((users) => {
      var user = users[0];
      knex("products")
        .select("*")
        .then((results) => {
          knex("users")
            .join('shared_links', 'users.id', '=', 'shared_links.users_id')
            .select('users.role','users.name','users.email','shared_links.click_count','shared_links.cost')
            //.groupBy('products.id','shared_links.id','users.id')
            .then((rows) => {
              let moolah = 0;
              rows.forEach( function(value, index){
                moolah += value.click_count * value.cost
              })
              let templateVars = {
                products: results.reverse(),
                loggedUser: user.role,
                name: user.name,
                email: user.email,
                moolah: moolah
              }
              res.render("userAds", templateVars);
            })
        });
    })
  });

  routes.get("/advertiser/payouts", (req, res) => {
    knex("users").select("*").where("id", '=', req.session.userId ).then((users) => {
      knex("users")
        .join("shared_links", "users.id", "=", "shared_links.users_id")
        .join("products", "products.id", "=", "shared_links.products_id")
        .select("users.name", "shared_links.products_id", "shared_links.click_count", "shared_links.cost", "shared_links.platform", "products.title")
        .where("creator_uid", "=", req.session.userId)
        .then((results) => {
          results = results.map((product)=>{
            product.total = Math.round(product.click_count * product.cost);
            return product;
          })
          let templateVars = {
            details: results,
          }
          res.render("advPayout",templateVars)
        })
    })
  })

  routes.get("/advertiser/stats", (req, res) => {
    knex('products')
      .join("users", "products.creator_uid", "=", "users.id")
      .select("products.title", "products.desc", "products.img_path", "products.id AS id", "users.email", "users.name","users.role")
      .where("creator_uid", "=", req.session.userId)
      .then((products) => {
        let templateVars = {
          loggedUser: products[0].role,
          products: products.reverse(),
          name: products[0].name,
          email: products[0].email,
          moolah: 10
        }
        res.render("userstats", templateVars);
      })
  })

  routes.get("/stats", (req, res) => {
    knex('products')
      .join('shared_links', 'products.id', '=', 'shared_links.products_id')
      .distinct('products.id')
      .select("products.title", "products.desc", "products.img_path", "products.id AS id")
      .where('shared_links.users_id', '=', req.session.userId)
      .then((rows) => {
        knex("users")
          .join('shared_links', 'users.id', '=', 'shared_links.users_id')
          .select('users.role','users.name','users.email','shared_links.click_count','shared_links.cost')
          //.groupBy('products.id','shared_links.id','users.id')
          .then((results) => {
            let moolah = 0;
            results.forEach( function(value, index){
              moolah += value.click_count * value.cost
            })
            let templateVars = {
              name: results[0].name,
              email: results[0].email,
              moolah: moolah,
              products: rows.reverse(),
              loggedUser: results[0].role
            }
            res.render("userstats", templateVars);
          })
      });
  });




  routes.get("/ads/:product_id", (req, res) => {

    let p_id = req.params.product_id;
    var count = [];
    var platfom = [];
    knex("users").select("*").where("id", '=', req.session.userId ).then((users) => {
      console.log('users',users);

          let user = users[0];
          knex("products")
            .join('shared_links', 'products.id', '=', 'shared_links.products_id' )
            .join('users', 'users.id', '=', 'shared_links.users_id')
            .select("*")
            .where( 'shared_links.products_id', '=', p_id)
            .then((results) => {
              console.log("Results Length", results.length);
              if(results.length == 0){
                knex("products")
                  .select("*")
                  .where("id", "=", p_id)
                  .then((rows) => {
                    console.log("inside", rows);
                    let product = rows[0];
                    let templateVars = {
                      ads: 0,
                      labels: 0,
                      loggedUser: user.role,
                      shareFb: {id: 0},
                      shareTw: {id: 0},
                      product: product
                     }
                     console.log(rows.length);
                     if (rows.length > 0){
                       console.log("inside if state");
                       res.render("product-page", templateVars);
                       return;
                     } else {
                       console.log("indise esle");
                       res.sendStatus(500);
                       return;
                     }
                  })
                } else {
                console.log("Hdjkashdkj");
              let product = results[0];
              let fbCount = 0;
              let twCount = 0;
              for (var i = 0; i < results.length; i++){
                if(results[i].platform == 'FB'){
                  fbCount += results[i].click_count;
                } else {
                  twCount += results[i].click_count
                }
              }
              count.push(fbCount);
              count.push(twCount);
              let templateVars = {
                loggedUser: user.role,
                //labels: JSON.stringify(platfom),
                ads: count,
                product: product,
                shareFb: {id: 0},
                shareTw: {id: 0},
                path2: "asdf"
              }
              if (results.length > 0){
                res.render("product-page", templateVars);
              } else {
                console.log("inside another else");
                res.sendStatus(500);
              }
            }
          });
      });
  });

  routes.get("/delete/:product_id", (req, res) => {
    console.log(req.params.product_id);
    knex('shared_links')
      .where('products_id', req.params.product_id)
      .del()
      .then((results) => {
        knex('products')
          .where('id', req.params.product_id)
          .del()
          .then((rows) => {
            console.log("Row deleted");
            res.redirect("/view")
          })
      })
  })

  routes.get("/:product_id", (req, res) => {

    let p_id = req.params.product_id;
    let u_id = req.session.userId;
   
    knex("products").select("*").where({id: p_id})
      .then((results) => {
        if (results.length === 0) {
          res.sendStatus(500);
          return;
        }
        let product = results[0];
        let empty_id = {id: null};
        if (u_id) {
          knex.raw(`INSERT INTO shared_links (products_id, users_id, platform, cost, click_count)
            VALUES (${p_id}, ${u_id}, 'FB', 1.10, 0), (${p_id} ,${u_id}, 'TW', 0.5, 0)
            ON CONFLICT ("products_id", "users_id", "platform") DO NOTHING`)
          .then (() => {
            knex("shared_links").select("id").where({products_id: p_id, users_id: u_id})
              .then((sl_list) => {
                console.log(sl_list[0], sl_list[1]);
                let templateVars = {
                  product: product,
                  loggedUser:'User',
                  shareFb: sl_list[0],
                  shareTw: sl_list[1],
                  user: 1
                }
                res.render("product-page", templateVars);
            });
          });
        } else {
          let templateVars = {
              product: product,
              loggedUser: 'User',
              shareFb: empty_id,
              shareTw: empty_id,
              user: 0
          }
          res.render("product-page", templateVars);
        }
    });
});

  return routes;
}
